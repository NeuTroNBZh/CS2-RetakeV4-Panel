import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'players'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('steam_id', 17).primary()
      table.string('display_name', 64).nullable()
      table.string('avatar_url', 255).nullable()
      table.timestamp('last_login_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
