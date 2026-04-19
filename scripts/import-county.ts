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

async function main() {
  const options = parseOptions()
  await ensureDatabaseUrl()

  const { createActorImportPreview, applyActorImportBatch } = await import("../lib/admin/imports")

  const directory = path.join(process.cwd(), options.inputRoot, options.countySlug)
  const actorsCsv = await readFile(path.join(directory, "actors.csv"), "utf8")
  const actorSourcesCsv = await readIfExists(path.join(directory, "actor_sources.csv"))
  const actorRepairServicesCsv = await readIfExists(path.join(directory, "actor_repair_services.csv"))

  const preview = await createActorImportPreview({
    filename: `county-${options.countySlug}.csv`,
    actorsCsv,
    actorSourcesCsv,
    actorRepairServicesCsv,
    createdById: null,
  })

  console.log(
    JSON.stringify(
      {
        countySlug: options.countySlug,
        dryRun: options.dryRun,
        preview: {
          create: preview.batch.createCount,
          update: preview.batch.updateCount,
          skip: preview.batch.skipCount,
          error: preview.batch.errorCount,
        },
      },
      null,
      2,
    ),
  )

  if (preview.batch.errorCount > 0) {
    const errorRows = preview.rows
      .filter((row) => row.validationErrors.length > 0)
      .map((row) => `  rad ${row.rowNumber} (${row.rowType}): ${row.validationErrors.join("; ")}`)
    console.error(`\nValidering feilet for ${options.countySlug}:\n${errorRows.join("\n")}`)
    process.exit(1)
  }

  if (options.dryRun) {
    console.log("\n--dry-run: ingen endringer lagret.")
    return
  }

  const applied = await applyActorImportBatch(preview.batch.id, null)
  console.log(
    JSON.stringify(
      {
        applied: {
          status: applied.status,
          totalRows: applied.totalRows,
        },
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
