import vine from '@vinejs/vine'
import z from 'zod'
import { ALLOWED_IMAGES_TYPES } from '../../../constants/file_ext.js'
import { ITEM_TYPES } from '../../../constants/item_types.js'

export const analyseImageValidator = vine.compile(
  vine.object({
    itemImage: vine.file({ extnames: ALLOWED_IMAGES_TYPES }),
  })
)

export const analyseImageSchema = z.object({
  data: z.object({
    name: z.string().describe('Nom du vêtement. Par exemple "T-shirt rouge motif fleurs"'),
    description: z
      .string()
      .describe('Description du vêtement avec des détails sur le style, la coupe, etc.'),
    tags: z
      .array(z.string())
      .describe(
        'Tags qui représentent le vêtement, par exemple ["décontracté", "streatwear", "classe"]'
      ),
    type: z.enum(ITEM_TYPES).describe('Type de vêtement.'),
    main_color: z.string().describe('Couleur principale du vêtement. Par exemple "rouge"'),
    additionnal_colors: z
      .array(z.string())
      .describe('Couleurs additionnelles du vêtement. Par exemple ["blanc", "noir"]'),
  }),
})
