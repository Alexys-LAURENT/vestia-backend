import vine from '@vinejs/vine'
import z from 'zod'
import { ALLOWED_IMAGES_TYPES } from '../../../constants/file_ext.js'
import { ITEM_FORMALITIES, ITEM_SEASONS, ITEM_TYPES } from '../../../constants/item_types.js'

export const analyseImageValidator = vine.compile(
  vine.object({
    itemImage: vine.file({ extnames: ALLOWED_IMAGES_TYPES }),
  })
)

export const analyseImageSchema = z.object({
  is_clothing: z
    .boolean()
    .describe(
      "Indique si l'image contient bien un vêtement ou accessoire de mode. Retourne true si c'est un vêtement/accessoire, false sinon."
    ),
  failure_reason: z
    .string()
    .nullable()
    .describe(
      "Si is_clothing est false, explique pourquoi l'analyse a échoué (ex: 'L\'image ne contient pas de vêtement', 'L\'image est floue', 'Plusieurs vêtements détectés'). Sinon, retourne null."
    ),
  data: z
    .object({
      name: z
        .string()
        .describe(
          'Nom court et descriptif du vêtement. Par exemple "T-shirt rouge à motif floral" ou "Jean slim bleu foncé"'
        ),
      description: z
        .string()
        .describe(
          'Description détaillée du vêtement incluant : le style général, la coupe, les matières visibles, les détails distinctifs (boutons, fermetures, motifs, broderies, etc.)'
        ),
      tags: z
        .array(z.string())
        .min(3)
        .max(8)
        .describe(
          'Tags décrivant le style et les occasions de port. Exemples : ["décontracté", "streetwear", "élégant", "vintage", "minimaliste", "bohème", "sportif", "formel"]'
        ),
      type: z
        .enum(ITEM_TYPES)
        .describe('Catégorie principale du vêtement parmi les types définis.'),
      main_color: z
        .string()
        .describe(
          'Couleur dominante du vêtement en français. Par exemple "rouge bordeaux", "bleu marine", "vert olive"'
        ),
      additional_colors: z
        .array(z.string())
        .describe(
          'Couleurs secondaires présentes sur le vêtement (motifs, détails, coutures). Tableau vide si unicolore.'
        ),
      season: z
        .array(z.enum(ITEM_SEASONS))
        .describe('Saisons recommandées pour porter ce vêtement.'),
      formality: z.enum(ITEM_FORMALITIES).describe('Niveau de formalité du vêtement.'),
    })
    .nullable()
    .describe('Données du vêtement. Null si is_clothing est false.'),
})

export const insertItemValdator = vine.compile(
  vine.object({
    name: vine.string(),
    description: vine.string(),
    tags: vine.union([
      vine.union.if((value) => vine.helpers.isArray<string>(value), vine.array(vine.string())),
      vine.union.else(vine.string().transform((value) => (value ? [value] : []))),
    ]),
    image: vine.file({ extnames: ALLOWED_IMAGES_TYPES }),
    type: vine.enum(ITEM_TYPES),
    season: vine.enum(ITEM_SEASONS),
    formality: vine.enum(ITEM_FORMALITIES),
    mainColor: vine.string(),
    additionalColors: vine.union([
      vine.union.if(
        (value) => vine.helpers.isArray<string>(value),
        vine.array(vine.string()).nullable()
      ),
      vine.union.else(
        vine
          .string()
          .nullable()
          .transform((value) => (value ? [value] : []))
      ),
    ]),
    brand: vine.string().nullable(),
    reference: vine.string().nullable(),
  })
)

export const getAllItemsValidator = vine.compile(
  vine.object({
    page: vine.number().optional(),
    limit: vine.number().optional(),
    type: vine.enum(ITEM_TYPES).optional(),
    search: vine.string().optional(),
  })
)
