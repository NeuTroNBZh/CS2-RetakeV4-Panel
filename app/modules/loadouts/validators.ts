import vine from '@vinejs/vine'

const team = vine.enum(['T', 'CT'] as const)
const roundType = vine.string().trim().minLength(1).maxLength(64)

export const weaponValidator = vine.create({
  team,
  roundType,
  slot: vine.enum(['primary', 'secondary'] as const),
  weapon: vine.string().trim().minLength(1).maxLength(64),
})

export const resetValidator = vine.create({ team, roundType })

export const awpValidator = vine.create({ team, optIn: vine.boolean() })
