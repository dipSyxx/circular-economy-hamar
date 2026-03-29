export type CsvRow = Record<string, string>

const splitCsvLine = (line: string) => {
  const values: string[] = []
  let current = ""
  let inQuotes = false

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    const next = line[index + 1]

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"'
        index += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === "," && !inQuotes) {
      values.push(current)
      current = ""
      continue
    }

    current += char
  }

  values.push(current)
  return values.map((value) => value.trim())
}

export const parseCsv = (input: string) => {
  const normalized = input.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").trim()
  if (!normalized) return []

  const lines = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length === 0) return []

  const header = splitCsvLine(lines[0]).map((column) => column.trim())
  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line)
    return header.reduce<CsvRow>((row, key, index) => {
      row[key] = values[index] ?? ""
      return row
    }, {})
  })
}

