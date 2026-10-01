export type Team = 'T' | 'CT'
export type Slot = 'primary' | 'secondary'

export const TEAMS: readonly Team[] = ['T', 'CT']
export const TEAM_VALUE: Record<Team, number> = { T: 0, CT: 1 }
export const ANY_ROUND_TYPE = '*'
export const CATALOG_FORMAT_VERSION = 1

export interface TeamCatalog {
  primaries: string[]
  secondaries: string[]
  defaultPrimary: string | null
  defaultSecondary: string | null
  awp: boolean
}

export interface RoundTypeCatalog {
  name: string
  teams: Record<Team, TeamCatalog>
}

export interface Catalog {
  roundTypes: RoundTypeCatalog[]
}

export type CatalogResult =
  | { kind: 'ok'; catalog: Catalog }
  | { kind: 'missing' }
  | { kind: 'unsupported'; formatVersion: number }
  | { kind: 'invalid' }

const isStringList = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string')

const isNullableString = (value: unknown): value is string | null =>
  value === null || typeof value === 'string'

function isTeamCatalog(value: unknown): value is TeamCatalog {
  const team = value as Partial<TeamCatalog> | null
  return (
    typeof team === 'object' &&
    team !== null &&
    isStringList(team.primaries) &&
    isStringList(team.secondaries) &&
    isNullableString(team.defaultPrimary) &&
    isNullableString(team.defaultSecondary) &&
    typeof team.awp === 'boolean'
  )
}

function isRoundType(value: unknown): value is RoundTypeCatalog {
  const roundType = value as Partial<RoundTypeCatalog> | null
  return (
    typeof roundType === 'object' &&
    roundType !== null &&
    typeof roundType.name === 'string' &&
    typeof roundType.teams === 'object' &&
    roundType.teams !== null &&
    TEAMS.every((team) => isTeamCatalog(roundType.teams?.[team]))
  )
}

export function readCatalog(
  row: { format_version: number; catalog: string } | null
): CatalogResult {
  if (row === null) return { kind: 'missing' }
  if (Number(row.format_version) !== CATALOG_FORMAT_VERSION) {
    return { kind: 'unsupported', formatVersion: Number(row.format_version) }
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(row.catalog)
  } catch {
    return { kind: 'invalid' }
  }
  const roundTypes = (parsed as { roundTypes?: unknown } | null)?.roundTypes
  if (!Array.isArray(roundTypes) || !roundTypes.every(isRoundType)) return { kind: 'invalid' }
  return { kind: 'ok', catalog: { roundTypes } }
}

const findRoundType = (catalog: Catalog, name: string) =>
  catalog.roundTypes.find((roundType) => roundType.name === name)

export function options(catalog: Catalog, roundType: string, team: Team, slot: Slot): string[] {
  const teamCatalog = findRoundType(catalog, roundType)?.teams[team]
  if (!teamCatalog) return []
  return slot === 'primary' ? teamCatalog.primaries : teamCatalog.secondaries
}

export function hasChoice(roundType: RoundTypeCatalog, team: Team): boolean {
  const teamCatalog = roundType.teams[team]
  return teamCatalog.primaries.length > 1 || teamCatalog.secondaries.length > 1
}

export function isAllowed(
  catalog: Catalog,
  selection: { roundType: string; team: Team; slot: Slot; weapon: string }
): boolean {
  return options(catalog, selection.roundType, selection.team, selection.slot).includes(
    selection.weapon
  )
}

// The AWP is volunteered per team: the toggle of a team shows when one of its round types hands it out.
export function offersAwp(catalog: Catalog, team: Team): boolean {
  return catalog.roundTypes.some((roundType) => roundType.teams[team].awp)
}
