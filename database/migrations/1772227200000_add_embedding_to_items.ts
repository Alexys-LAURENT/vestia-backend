import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.raw('CREATE EXTENSION IF NOT EXISTS vector')
    this.schema.alterTable('items', (table) => {
      table.specificType('embedding', 'vector(2560)').nullable()
    })
  }

  async down() {
    this.schema.alterTable('items', (table) => {
      table.dropColumn('embedding')
    })
  }
}
