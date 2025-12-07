import { BaseModel, belongsTo, column, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, ManyToMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import { ITEM_TYPES } from '../../constants/item_types.js'
import User from './user.js'

export default class Item extends BaseModel {
  @column({ isPrimary: true })
  declare idItem: number

  @column()
  declare idUser: number

  @column()
  declare name: string

  @column()
  declare description: string

  @column()
  declare tags: string[]

  @column()
  declare imageUrl: string

  @column()
  declare type: (typeof ITEM_TYPES)[number]

  @column()
  declare mainColor: string

  @column()
  declare additionnalColors: string[] | null

  @column()
  declare brand: string | null

  @column()
  declare reference: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => User, {
    localKey: 'idUser',
    foreignKey: 'idUser',
  })
  declare owner: BelongsTo<typeof User>

  @manyToMany(() => User, {
    localKey: 'idItem',
    relatedKey: 'idLook',
    pivotForeignKey: 'id_item',
    pivotRelatedForeignKey: 'id_look',
    pivotTable: 'looks_items',
    pivotTimestamps: true,
  })
  declare users_notifications: ManyToMany<typeof User>
}
