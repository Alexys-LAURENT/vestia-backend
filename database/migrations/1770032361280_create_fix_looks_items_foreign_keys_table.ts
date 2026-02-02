import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'looks_items'

  async up() {
    // Drop the entire looks_items table and recreate it correctly
    this.schema.dropTableIfExists(this.tableName)

    this.schema.createTable(this.tableName, (table) => {
      table
        .integer('id_look')
        .notNullable()
        .unsigned()
        .references('id_look')
        .inTable('looks')
        .onDelete('CASCADE')
      table
        .integer('id_item')
        .notNullable()
        .unsigned()
        .references('id_item')
        .inTable('items')
        .onDelete('CASCADE')

      // Composite primary key for pivot table
      table.primary(['id_look', 'id_item'])

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    // Recreate the broken version if we need to rollback
    this.schema.dropTableIfExists(this.tableName)

    this.schema.createTable(this.tableName, (table) => {
      table.increments('id_look').notNullable().primary().unsigned().references('id_user').inTable('users').onDelete('CASCADE')
      table.integer('id_item').notNullable().unsigned().references('id_item').inTable('items').onDelete('CASCADE')
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }
}
