import { BaseSchema } from '@adonisjs/lucid/schema'
import { ITEM_FORMALITIES, ITEM_SEASONS, ITEM_TYPES } from '../../constants/item_types.js'

export default class extends BaseSchema {
  protected itemsTable = 'items'
  protected looksTable = 'looks'
  protected looksItemsTable = 'looks_items'

  async up() {
    this.schema.createTable(this.itemsTable, (table) => {
      table.increments('id_item').notNullable().primary()
      table
        .integer('id_user')
        .notNullable()
        .unsigned()
        .references('id_user')
        .inTable('users')
        .onDelete('CASCADE')
      table.string('name').notNullable()
      table.text('description').notNullable()
      table.json('tags').notNullable()
      table.string('image_url').notNullable()
      table.enum('type', ITEM_TYPES).notNullable()
      table.enum('season', ITEM_SEASONS).notNullable()
      table.enum('formality', ITEM_FORMALITIES).notNullable()
      table.string('main_color').notNullable()
      table.json('additional_colors').nullable()
      table.string('brand').nullable()
      table.string('reference').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })

    this.schema.createTable(this.looksTable, (table) => {
      table.increments('id_look').notNullable().primary()
      table
        .integer('id_user')
        .notNullable()
        .unsigned()
        .references('id_user')
        .inTable('users')
        .onDelete('CASCADE')
      table.string('event').nullable()
      table.string('avatar_image_url').nullable()
      table.boolean('is_ai_generated').notNullable().defaultTo(false)

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })

    this.schema.createTable(this.looksItemsTable, (table) => {
      table
        .increments('id_look')
        .notNullable()
        .primary()
        .unsigned()
        .references('id_user')
        .inTable('users')
        .onDelete('CASCADE')
      table
        .integer('id_item')
        .notNullable()
        .unsigned()
        .references('id_item')
        .inTable('items')
        .onDelete('CASCADE')

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.itemsTable)
    this.schema.dropTable(this.looksTable)
    this.schema.dropTable(this.looksItemsTable)
  }
}
