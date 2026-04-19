import { readFile, access } from "node:fs/promises"
import path from "node:path"

const parseArg = (flag: string) => {
  const entry = process.argv.find((arg) => arg.startsWith(`${flag}=`))
  return entry ? entry.slice(flag.length + 1).trim() : ""
}

const parseOptions = () => {
  const countySlug = parseArg("--county")
  if (!countySlug) {
    throw new Error("Pass --county=<county-slug>.")
  }

  return {
    countySlug,
    dryRun: process.argv.includes("--dry-run"),
    chunkSize: Number(parseArg("--chunk-size") || "50"),
    inputRoot: parseArg("--input-root") || path.join("data", "imports", "counties"),
  }
}

const ensureDatabaseUrl = async () => {
  if (process.env.DATABASE_URL) return

  const envPath = path.join(process.cwd(), ".env")
  const envContents = await readFile(envPath, "utf8")
  const databaseUrlLine = envContents
    .split(/\r?\n/)
    .find((line) => line.trim().startsWith("DATABASE_URL="))

  if (!databaseUrlLine) {
    throw new Error("DATABASE_URL mangler i .env")
  }

  process.env.DATABASE_URL = databaseUrlLine.slice("DATABASE_URL=".length).trim()
}

const readIfExists = async (filePath: string) => {
  try {
    await access(filePath)
    return await readFile(filePath, "utf8")
  } catch {
    return undefined
  }
}

/** Split a CSV into chunks of N data rows, keeping the header on each chunk. */
function chunkCsv(csv: string, chunkSize: number): string[] {
  const lines = csv.trim().split(/\r?\n/)
  const header = lines[0]
  const rows = lines.slice(1).filter((l) => l.trim() !== "")
  const chunks: string[] = []
  for (let i = 0; i < rows.length; i += chunkSize) {
    chunks.push([header, ...rows.slice(i, i + chunkSize)].join("\n"))
  }
  return chunks
}

/** Extract the set of actor_slug values from an actors CSV chunk. */
function slugsFromActorsCsv(csv: string): Set<string> {
  const lines = csv.trim().split(/\r?\n/)
  const headers = lines[0].split(",")
  const slugIdx = headers.indexOf("actor_slug")
  if (slugIdx === -1) return new Set()
  return new Set(
    lines
      .slice(1)
      .filter((l) => l.trim() !== "")
      .map((l) => l.split(",")[slugIdx]),
  )
}

/** Return only the rows of a related CSV whose actor_slug is in the given set. */
function filterRelatedCsv(csv: string | undefined, slugs: Set<string>): string | undefined {
  if (!csv) return undefined
  const lines = csv.trim().split(/\r?\n/)
  const header = lines[0]
  const headers = header.split(",")
  const slugIdx = headers.indexOf("actor_slug")
  if (slugIdx === -1) return csv
  const filtered = lines.slice(1).filter((l) => {
    const slug = l.split(",")[slugIdx]
    return slug && slugs.has(slug)
  })
  return filtered.length > 0 ? [header, ...filtered].join("\n") : undefined
}

async function main() {
  const options = parseOptions()
  await ensureDatabaseUrl()

  const { createActorImportPreview, applyActorImportBatch } = await import("../lib/admin/imports")

  const directory = path.join(process.cwd(), options.inputRoot, options.countySlug)
  const actorsCsv = await readFile(path.join(directory, "actors.csv"), "utf8")
  const actorSourcesCsv = await readIfExists(path.join(directory, "actor_sources.csv"))
  const actorRepairServicesCsv = await readIfExists(path.join(directory, "actor_repair_services.csv"))

  const chunks = chunkCsv(actorsCsv, options.chunkSize)
  const totalActors = actorsCsv.trim().split(/\r?\n/).length - 1

  console.log(
    JSON.stringify(
      {
        countySlug: options.countySlug,
        dryRun: options.dryRun,
        totalActors,
        chunks: chunks.length,
        chunkSize: options.chunkSize,
      },
      null,
      2,
    ),
  )

  let totalCreate = 0
  let totalUpdate = 0
  let totalSkip = 0
  let totalError = 0

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    const slugs = slugsFromActorsCsv(chunk)
    const chunkSources = filterRelatedCsv(actorSourcesCsv, slugs)
    const chunkRepairs = filterRelatedCsv(actorRepairServicesCsv, slugs)

    const preview = await createActorImportPreview({
      filename: `county-${options.countySlug}-chunk-${i + 1}-of-${chunks.length}.csv`,
      actorsCsv: chunk,
      actorSourcesCsv: chunkSources,
      actorRepairServicesCsv: chunkRepairs,
      createdById: null,
    })

    totalCreate += preview.batch.createCount
    totalUpdate += preview.batch.updateCount
    totalSkip += preview.batch.skipCount
    totalError += preview.batch.errorCount

    if (preview.batch.errorCount > 0) {
      const errorRows = preview.rows
        .filter((row) => row.validationErrors.length > 0)
        .map((row) => `  rad ${row.rowNumber} (${row.rowType}): ${row.validationErrors.join("; ")}`)
      console.error(`\nChunk ${i + 1}: validering feilet:\n${errorRows.join("\n")}`)
      process.exit(1)
    }

    if (options.dryRun) {
      process.stdout.write(`  chunk ${i + 1}/${chunks.length}: ${[...slugs].slice(0, 3).join(", ")}… (dry-run)\n`)
      continue
    }

    await applyActorImportBatch(preview.batch.id, null)
    process.stdout.write(`  chunk ${i + 1}/${chunks.length}: applied ${preview.batch.createCount} create, ${preview.batch.updateCount} update\n`)
  }

  console.log(
    JSON.stringify(
      {
        summary: {
          create: totalCreate,
          update: totalUpdate,
          skip: totalSkip,
          error: totalError,
        },
        status: options.dryRun ? "dry-run" : "applied",
      },
      null,
      2,
    ),
  )
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
