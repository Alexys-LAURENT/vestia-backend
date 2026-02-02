import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'planned_outfits'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id_planned_outfit').notNullable().primary()

      table
        .integer('id_look')
        .notNullable()
        .unsigned()
        .references('id_look')
        .inTable('looks')
        .onDelete('CASCADE')

      table
        .integer('id_user')
        .notNullable()
        .unsigned()
        .references('id_user')
        .inTable('users')
        .onDelete('CASCADE')

      table.date('planned_date').notNullable()
      table.text('notes').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      // Index for efficient queries by user and date
      table.index(['id_user', 'planned_date'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
