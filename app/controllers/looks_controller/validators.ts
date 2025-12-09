import vine from '@vinejs/vine'

export const getAllLooksValidator = vine.compile(
  vine.object({
    page: vine.number().optional(),
    limit: vine.number().optional(),
  })
)
