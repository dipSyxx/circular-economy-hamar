import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { normalizeCountyImportDataset } from "../lib/county-import-normalizer"

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
    inputRoot: parseArg("--input-root") || path.join("data", "imports", "countiesReal"),
    outputRoot: parseArg("--output-root") || path.join("data", "imports", "counties"),
  }
}

const readIfExists = async (filePath: string) => {
  try {
    return await readFile(filePath, "utf8")
  } catch {
    return undefined
  }
}

async function main() {
  const options = parseOptions()
  const inputDir = path.join(process.cwd(), options.inputRoot, options.countySlug)
  const outputDir = path.join(process.cwd(), options.outputRoot, options.countySlug)

  const actorsCsv = await readFile(path.join(inputDir, "actors.csv"), "utf8")
  const actorSourcesCsv = await readIfExists(path.join(inputDir, "actor_sources.csv"))
  const actorRepairServicesCsv = await readIfExists(path.join(inputDir, "actor_repair_services.csv"))

  const normalized = normalizeCountyImportDataset({
    countySlug: options.countySlug,
    actorsCsv,
    actorSourcesCsv,
    actorRepairServicesCsv,
  })

  await mkdir(outputDir, { recursive: true })
  await Promise.all([
    writeFile(path.join(outputDir, "actors.csv"), normalized.actorsCsv, "utf8"),
    writeFile(path.join(outputDir, "actor_sources.csv"), normalized.actorSourcesCsv, "utf8"),
    writeFile(path.join(outputDir, "actor_repair_services.csv"), normalized.actorRepairServicesCsv, "utf8"),
    writeFile(path.join(outputDir, "NORMALIZATION_REPORT.md"), normalized.report, "utf8"),
  ])

  console.log(
    JSON.stringify(
      {
        countySlug: options.countySlug,
        outputDir,
        summary: normalized.summary,
      },
      null,
      2,
    ),
  )
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Could not normalize county import.")
  process.exit(1)
})
