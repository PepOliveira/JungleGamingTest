type ParamValue =
  string | number | boolean | null | undefined | readonly (string | number | boolean)[]

export function serializeParams(params: Record<string, ParamValue>) {
  const search = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') {
      continue
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        search.append(key, String(item))
      }
      continue
    }
    search.append(key, String(value))
  }

  return search.toString()
}
