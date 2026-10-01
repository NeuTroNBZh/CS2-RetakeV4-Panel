import {
  ANY_ROUND_TYPE,
  TEAMS,
  hasChoice,
  offersAwp,
  type CatalogResult,
  type Slot,
  type Team,
} from '#modules/loadouts/catalog'
import type { PreferenceRow } from '#modules/loadouts/loadout_repository'
import { weaponCategory, weaponLabel } from '#modules/loadouts/weapons'

export interface SlotView {
  choices: { id: string; label: string; category: string }[]
  selected: string | null
  defaultId: string | null
}

export interface RoundTypeView {
  name: string
  primary: SlotView
  secondary: SlotView
}

export interface LoadoutsView {
  status: 'ok' | 'missing' | 'unsupported' | 'invalid'
  formatVersion: number | null
  awp: { offered: boolean; optIn: boolean }
  teams: Record<Team, RoundTypeView[]>
}

function slotView(choices: string[], defaultId: string | null, saved: string | null): SlotView {
  return {
    choices: choices.map((id) => ({ id, label: weaponLabel(id), category: weaponCategory(id) })),
    selected: saved !== null && choices.includes(saved) ? saved : null,
    defaultId,
  }
}

export function buildLoadoutsView(
  result: CatalogResult,
  preferences: PreferenceRow[]
): LoadoutsView {
  const optIn = preferences.some((row) => row.roundType === ANY_ROUND_TYPE && row.awpOptIn)
  if (result.kind !== 'ok') {
    return {
      status: result.kind,
      formatVersion: result.kind === 'unsupported' ? result.formatVersion : null,
      awp: { offered: false, optIn },
      teams: { T: [], CT: [] },
    }
  }
  const saved = (team: Team, roundType: string, slot: Slot) => {
    const row = preferences.find((p) => p.team === team && p.roundType === roundType)
    return (slot === 'primary' ? row?.primary : row?.secondary) ?? null
  }
  const teamViews = (team: Team): RoundTypeView[] =>
    result.catalog.roundTypes
      .filter((roundType) => hasChoice(roundType, team))
      .map((roundType) => {
        const catalog = roundType.teams[team]
        return {
          name: roundType.name,
          primary: slotView(
            catalog.primaries,
            catalog.defaultPrimary,
            saved(team, roundType.name, 'primary')
          ),
          secondary: slotView(
            catalog.secondaries,
            catalog.defaultSecondary,
            saved(team, roundType.name, 'secondary')
          ),
        }
      })
  return {
    status: 'ok',
    formatVersion: null,
    awp: { offered: offersAwp(result.catalog), optIn },
    teams: Object.fromEntries(TEAMS.map((team) => [team, teamViews(team)])) as Record<
      Team,
      RoundTypeView[]
    >,
  }
}
