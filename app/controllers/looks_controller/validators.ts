import vine from '@vinejs/vine'
import z from 'zod'

export const getAllLooksValidator = vine.compile(
  vine.object({
    page: vine.number().optional(),
    limit: vine.number().optional(),
  })
)

export const onlyIdLookValidator = vine.compile(
  vine.object({
    idLook: vine.number(),
  })
)

export const createLookValidator = vine.compile(
  vine.object({
    itemIds: vine
      .array(
        vine.number().exists(async (db, value) => {
          const row = await db.from('items').where('id_item', value).first()
          return row ? true : false
        })
      )
      .minLength(2)
      .maxLength(6),
    event: vine.string().optional().nullable(),
    isAiGenerated: vine.boolean().optional(),
  })
)

export const generateLookValidator = vine.compile(
  vine.object({
    forcedItemIds: vine
      .array(
        vine.number().exists(async (db, value) => {
          const row = await db.from('items').where('id_item', value).first()
          return row ? true : false
        })
      )
      .optional(),
    shouldIncludeWeather: vine.boolean().optional(),
    wheatherDate: vine.date().optional(),
    notLikedLookItemsIds: vine
      .array(
        vine.number().exists(async (db, value) => {
          const row = await db.from('items').where('id_item', value).first()
          return row ? true : false
        })
      )
      .optional()
      .nullable(),
  })
)

export const lookGenerationSchema = z.object({
  items: z
    .array(
      z.object({
        idItem: z.number().describe('ID du vêtement'),
        reason: z.string().describe('Pourquoi ce vêtement a été choisi'),
      })
    )
    .min(2) // Au minimum haut + bas
    .max(6)
    .describe(
      'Les vêtements sélectionnés pour la tenue - UN SEUL vêtement par type (pas 2 pantalons, pas 2 vestes)'
    ),

  generalReasoning: z.string().describe("Explication générale de l'harmonie de la tenue"),
})
