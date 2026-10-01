import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Player extends BaseModel {
  static connection = 'panel'
  static selfAssignPrimaryKey = true

  @column({ isPrimary: true })
  declare steamId: string

  @column()
  declare displayName: string | null

  @column()
  declare avatarUrl: string | null

  @column.dateTime({ autoCreate: true })
  declare lastLoginAt: DateTime
}
