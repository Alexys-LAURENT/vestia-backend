import vine from '@vinejs/vine'

export const createPlannedOutfitValidator = vine.compile(
  vine.object({
    lookId: vine.number().exists(async (db, value) => {
      const row = await db.from('looks').where('id_look', value).first()
      return row ? true : false
    }),
    plannedDate: vine.string(),
    notes: vine.string().optional().nullable(),
  })
)

export const updatePlannedOutfitValidator = vine.compile(
  vine.object({
    plannedDate: vine.string().optional(),
    notes: vine.string().optional().nullable(),
  })
)

export const getPlannedOutfitsValidator = vine.compile(
  vine.object({
    startDate: vine.string().optional(),
    endDate: vine.string().optional(),
  })
)

export const onlyIdPlannedOutfitValidator = vine.compile(
  vine.object({
    idPlannedOutfit: vine.number(),
  })
)
