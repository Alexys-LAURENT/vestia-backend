import vine from '@vinejs/vine'
import { ITEM_FORMALITIES, ITEM_SEASONS, ITEM_TYPES } from '../../../constants/item_types.js'

export const wardrobeStatsValidator = vine.compile(vine.object({}))

export const searchItemsValidator = vine.compile(
  vine.object({
    type: vine.enum(ITEM_TYPES).optional(),
    season: vine.enum(ITEM_SEASONS).optional(),
    formality: vine.enum(ITEM_FORMALITIES).optional(),
    color: vine.string().optional(),
    limit: vine.number().optional(),
  })
)

export const semanticSearchValidator = vine.compile(
  vine.object({
    query: vine.string().minLength(2),
    limit: vine.number().optional(),
  })
)

export const generateOutfitValidator = vine.compile(
  vine.object({
    context: vine.string().optional(),
    forcedItemIds: vine.array(vine.number()).optional(),
    excludedItemIds: vine.array(vine.number()).optional(),
  })
)

export const saveLookValidator = vine.compile(
  vine.object({
    itemIds: vine.array(vine.number()).minLength(2).maxLength(6),
    event: vine.string().optional().nullable(),
  })
)
