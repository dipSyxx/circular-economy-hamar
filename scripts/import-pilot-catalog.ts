import { readFile, access } from "node:fs/promises"
import path from "node:path"

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

const importCounties = async () => {
  await ensureDatabaseUrl()

  const { createActorImportPreview, applyActorImportBatch } = await import("../lib/admin/imports")

  const pilotDirectories = ["innlandet", "akershus", "oslo"] as const
  for (const county of pilotDirectories) {
    const directory = path.join(process.cwd(), "data", "imports", "pilot", county)
    const actorsCsv = await readFile(path.join(directory, "actors.csv"), "utf8")
    const actorSourcesCsv = await readIfExists(path.join(directory, "actor_sources.csv"))
    const actorRepairServicesCsv = await readIfExists(path.join(directory, "actor_repair_services.csv"))

    const preview = await createActorImportPreview({
      filename: `pilot-${county}.csv`,
      actorsCsv,
      actorSourcesCsv,
      actorRepairServicesCsv,
      createdById: null,
    })

    console.log(
      `[preview] ${county}: create=${preview.batch.createCount} update=${preview.batch.updateCount} skip=${preview.batch.skipCount} error=${preview.batch.errorCount}`,
    )

    if (preview.batch.errorCount > 0) {
      const errorRows = preview.rows
        .filter((row) => row.validationErrors.length > 0)
        .map((row) => `${row.rowType} rad ${row.rowNumber}: ${row.validationErrors.join("; ")}`)
      throw new Error(`Importpreview feilet for ${county}\n${errorRows.join("\n")}`)
    }

    const applied = await applyActorImportBatch(preview.batch.id, null)
    console.log(`[applied] ${county}: status=${applied.status} rows=${applied.totalRows}`)
  }
}

void importCounties().catch((error) => {
  console.error(error)
  process.exit(1)
})
