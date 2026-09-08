export interface SupportRegion {
  slug: string
  sido_code: string
  level: "sido" | "sigungu"
}

export function getSupportProgramUrl(
  program: { slug: string; region_id: number | null },
  regions: ReadonlyMap<number, SupportRegion>,
): string {
  if (program.region_id === null) return `/support/national/${program.slug}`
  const region = regions.get(program.region_id)
  if (!region) return "/support"
  if (region.level === "sido") return `/support/region/${region.slug}`
  const province = [...regions.values()].find(
    (item) => item.level === "sido" && item.sido_code === region.sido_code,
  )
  return province
    ? `/support/region/${province.slug}/${region.slug}`
    : "/support"
}
