import { tool } from 'ai'
import { z } from 'zod'
import { ITEM_FORMALITIES, ITEM_SEASONS, ITEM_TYPES } from '../../constants/item_types.js'
import type { ChatToolContext } from './chat_tool_context.js'

const searchItemsSchema = z.object({
  type: z.enum(ITEM_TYPES).optional().describe('Type de vêtement à filtrer'),
  season: z.enum(ITEM_SEASONS).optional().describe('Saison du vêtement'),
  formality: z.enum(ITEM_FORMALITIES).optional().describe('Niveau de formalité'),
  color: z
    .string()
    .optional()
    .describe('Couleur à rechercher (recherche partielle, ex: "rouge" trouvera "rouge bordeaux")'),
  limit: z.number().optional().default(20).describe('Nombre maximum de résultats'),
})

export const createSearchItemsTool = (ctx: ChatToolContext) =>
  tool({
    description:
      'Recherche des vêtements dans la garde-robe avec des filtres précis et combinables. Retourne la liste des vêtements correspondants.',
    inputSchema: searchItemsSchema,
    execute: async (params) => {
      const items = await ctx.itemsRepository.searchWithFilters(ctx.userId, {
        type: params.type,
        season: params.season,
        formality: params.formality,
        color: params.color,
        limit: params.limit,
      })
      return { items: items.map((i) => i.toJSON()), total: items.length }
    },
  })
