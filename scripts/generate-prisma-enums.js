const fs = require("node:fs")
const path = require("node:path")

const repoRoot = path.resolve(__dirname, "..")
const schemaPath = path.join(repoRoot, "prisma", "schema.prisma")
const outputPath = path.join(repoRoot, "lib", "prisma-enums.ts")

const readSchema = () => fs.readFileSync(schemaPath, "utf8")

const extractEnum = (schema, enumName) => {
  const lines = schema.split(/\r?\n/)
  const values = []
  let inEnum = false

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!inEnum) {
      if (line.startsWith(`enum ${enumName} `) || line === `enum ${enumName} {`) {
        inEnum = true
      }
      continue
    }

    if (line.startsWith("}")) break
    if (!line || line.startsWith("//")) continue

    const cleaned = line.split("//")[0]?.trim() ?? ""
    if (!cleaned) continue

    const token = cleaned.split(/\s+/)[0]
    if (token) values.push(token)
  }

  if (!values.length) {
    throw new Error(`Could not find enum ${enumName} in schema.`)
  }

  return values
}

const formatArray = (values) => values.map((value) => `  "${value}",`).join("\n")

const schema = readSchema()
const itemTypes = extractEnum(schema, "ItemType")
const problemTypes = extractEnum(schema, "ProblemType")

const output = `// This file is generated from prisma/schema.prisma.
// Do not edit manually. Run "pnpm generate:prisma-enums" to update.

export const ITEM_TYPES = [
${formatArray(itemTypes)}
] as const

export type ItemType = (typeof ITEM_TYPES)[number]

export const PROBLEM_TYPES = [
${formatArray(problemTypes)}
] as const

export type ProblemType = (typeof PROBLEM_TYPES)[number]
`

fs.writeFileSync(outputPath, output, "utf8")
console.log(`Generated ${path.relative(repoRoot, outputPath)}`)
