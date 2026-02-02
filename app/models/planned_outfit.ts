import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Look from './look.js'
import User from './user.js'

export default class PlannedOutfit extends BaseModel {
  @column({ isPrimary: true })
  declare idPlannedOutfit: number

  @column()
  declare idLook: number

  @column()
  declare idUser: number

  @column.date()
  declare plannedDate: DateTime

  @column()
  declare notes: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Look, {
    localKey: 'idLook',
    foreignKey: 'idLook',
  })
  declare look: BelongsTo<typeof Look>

  @belongsTo(() => User, {
    localKey: 'idUser',
    foreignKey: 'idUser',
  })
  declare user: BelongsTo<typeof User>
}
