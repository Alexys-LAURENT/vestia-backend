import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import Item from './item.js'
import User from './user.js'
import PlannedOutfit from './planned_outfit.js'

export default class Look extends BaseModel {
  @column({ isPrimary: true })
  declare idLook: number

  @column()
  declare idUser: number

  @column()
  declare event: string | null

  @column()
  declare avatarImageUrl: string | null

  @column()
  declare isAiGenerated: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => User, {
    localKey: 'idUser',
    foreignKey: 'idUser',
  })
  declare owner: BelongsTo<typeof User>

  @manyToMany(() => Item, {
    localKey: 'idLook',
    relatedKey: 'idItem',
    pivotForeignKey: 'id_look',
    pivotRelatedForeignKey: 'id_item',
    pivotTable: 'looks_items',
    pivotTimestamps: true,
  })
  declare items: ManyToMany<typeof Item>

  @hasMany(() => PlannedOutfit, {
    localKey: 'idLook',
    foreignKey: 'idLook',
  })
  declare plannedOutfits: HasMany<typeof PlannedOutfit>
}
