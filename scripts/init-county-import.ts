import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { actorImportTemplates } from "../lib/import-templates"
import { getCountyBySlug, norwayCounties } from "../lib/geo"

const parseCounties = () => {
  if (process.argv.includes("--all")) {
    return norwayCounties
  }

  const countyFlag = process.argv.find((arg) => arg.startsWith("--county="))
  if (!countyFlag) {
    throw new Error("Pass --county=<county-slug> or --all.")
  }

  const countySlug = countyFlag.slice("--county=".length).trim()
  if (!countySlug) {
    throw new Error("County slug cannot be empty.")
  }

  const county = getCountyBySlug(countySlug)
  if (!county) {
    throw new Error(`Unknown county slug: ${countySlug}`)
  }

  return [county]
}

const ensureFile = async (filePath: string, content: string) => {
  try {
    await readFile(filePath, "utf8")
    return false
  } catch {
    await writeFile(filePath, content, "utf8")
    return true
  }
}

async function main() {
  const counties = parseCounties()
  const summaries = []

  for (const county of counties) {
    const countyDir = path.join(process.cwd(), "data", "imports", "counties", county.slug)
    await mkdir(countyDir, { recursive: true })

    const createdFiles = []

    if (
      await ensureFile(
        path.join(countyDir, "actors.csv"),
        actorImportTemplates.actors,
      )
    ) {
      createdFiles.push("actors.csv")
    }

    if (
      await ensureFile(
        path.join(countyDir, "actor_sources.csv"),
        actorImportTemplates.actor_sources,
      )
    ) {
      createdFiles.push("actor_sources.csv")
    }

    if (
      await ensureFile(
        path.join(countyDir, "actor_repair_services.csv"),
        actorImportTemplates.actor_repair_services,
      )
    ) {
      createdFiles.push("actor_repair_services.csv")
    }

    if (
      await ensureFile(
        path.join(countyDir, "README.txt"),
        [
          `County import workspace for ${county.name}.`,
          "",
          "1. Fill actors.csv first.",
          "2. Add actor_sources.csv for every actor.",
          "3. Add actor_repair_services.csv only for repair-capable categories.",
          "4. Preview in /admin/imports?county=<slug> before applying.",
          "",
          `County slug: ${county.slug}`,
        ].join("\n"),
      )
    ) {
      createdFiles.push("README.txt")
    }

    summaries.push({
      county: county.name,
      countySlug: county.slug,
      directory: countyDir,
      createdFiles,
    })
  }

  console.log(
    JSON.stringify(
      {
        totalCounties: counties.length,
        counties: summaries,
      },
      null,
      2,
    ),
  )
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Could not initialize county import workspace.")
  process.exit(1)
})
