type SupportDate = Date | string | number | null | undefined

export function parseSupportDate(value: SupportDate): Date | null {
  if (value == null || (typeof value === "string" && !value.trim())) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isFinite(date.getTime()) ? date : null
}

export function formatSupportDate(value: SupportDate): string {
  return parseSupportDate(value)?.toLocaleDateString("ko-KR") ?? "미정"
}
