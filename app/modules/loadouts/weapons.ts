type Category = 'rifle' | 'smg' | 'heavy' | 'sniper' | 'pistol'

const WEAPONS: Record<string, { label: string; category: Category }> = {
  weapon_ak47: { label: 'AK-47', category: 'rifle' },
  weapon_m4a1: { label: 'M4A4', category: 'rifle' },
  weapon_m4a1_silencer: { label: 'M4A1-S', category: 'rifle' },
  weapon_famas: { label: 'FAMAS', category: 'rifle' },
  weapon_galilar: { label: 'Galil AR', category: 'rifle' },
  weapon_aug: { label: 'AUG', category: 'rifle' },
  weapon_sg556: { label: 'SG 553', category: 'rifle' },
  weapon_ssg08: { label: 'SSG 08', category: 'sniper' },
  weapon_awp: { label: 'AWP', category: 'sniper' },
  weapon_scar20: { label: 'SCAR-20', category: 'sniper' },
  weapon_g3sg1: { label: 'G3SG1', category: 'sniper' },
  weapon_mac10: { label: 'MAC-10', category: 'smg' },
  weapon_mp9: { label: 'MP9', category: 'smg' },
  weapon_mp7: { label: 'MP7', category: 'smg' },
  weapon_mp5sd: { label: 'MP5-SD', category: 'smg' },
  weapon_ump45: { label: 'UMP-45', category: 'smg' },
  weapon_p90: { label: 'P90', category: 'smg' },
  weapon_bizon: { label: 'PP-Bizon', category: 'smg' },
  weapon_nova: { label: 'Nova', category: 'heavy' },
  weapon_xm1014: { label: 'XM1014', category: 'heavy' },
  weapon_mag7: { label: 'MAG-7', category: 'heavy' },
  weapon_sawedoff: { label: 'Sawed-Off', category: 'heavy' },
  weapon_m249: { label: 'M249', category: 'heavy' },
  weapon_negev: { label: 'Negev', category: 'heavy' },
  weapon_glock: { label: 'Glock-18', category: 'pistol' },
  weapon_hkp2000: { label: 'P2000', category: 'pistol' },
  weapon_usp_silencer: { label: 'USP-S', category: 'pistol' },
  weapon_p250: { label: 'P250', category: 'pistol' },
  weapon_fiveseven: { label: 'Five-SeveN', category: 'pistol' },
  weapon_tec9: { label: 'Tec-9', category: 'pistol' },
  weapon_cz75a: { label: 'CZ75-Auto', category: 'pistol' },
  weapon_deagle: { label: 'Desert Eagle', category: 'pistol' },
  weapon_revolver: { label: 'R8 Revolver', category: 'pistol' },
  weapon_elite: { label: 'Dual Berettas', category: 'pistol' },
}

export function weaponLabel(id: string): string {
  return WEAPONS[id]?.label ?? id
}

export function weaponCategory(id: string): Category | 'unknown' {
  return WEAPONS[id]?.category ?? 'unknown'
}
