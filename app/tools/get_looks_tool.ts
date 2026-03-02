import { tool } from 'ai'
import { z } from 'zod'
import { ITEM_TYPES } from '../../constants/item_types.js'
import type { ChatToolContext } from './chat_tool_context.js'

const getLooksSchema = z.object({
  event: z
    .string()
    .optional()
    .describe(
      "Recherche par nom d'événement/occasion (recherche partielle, ex: 'soirée', 'mariage')"
    ),
  itemName: z
    .string()
    .optional()
    .describe(
      'Recherche les tenues contenant un vêtement dont le nom correspond (recherche partielle)'
    ),
  itemType: z
    .enum(ITEM_TYPES)
    .optional()
    .describe('Recherche les tenues contenant un vêtement de ce type'),
  itemIds: z
    .array(z.number())
    .optional()
    .describe('Recherche les tenues contenant un ou plusieurs vêtements par leurs IDs'),
  isAiGenerated: z
    .boolean()
    .optional()
    .describe('Filtrer par tenues générées par IA (true) ou manuelles (false)'),
  limit: z.number().optional().default(20).describe('Nombre maximum de résultats'),
})

export const createGetLooksTool = (ctx: ChatToolContext) =>
  tool({
    description:
      "Recherche dans les tenues (looks) sauvegardées de l'utilisateur. Peut filtrer par événement, par nom de vêtement contenu, par type de vêtement, ou par origine (IA/manuelle). Sans filtre, retourne les tenues les plus récentes.",
    inputSchema: getLooksSchema,
    execute: async (params) => {
      const looks = await ctx.looksRepository.searchLooks(ctx.userId, {
        event: params.event,
        itemName: params.itemName,
        itemType: params.itemType,
        itemIds: params.itemIds,
        isAiGenerated: params.isAiGenerated,
        limit: params.limit,
      })
      return { looks: looks.map((l) => l.toJSON()), total: looks.length }
    },
  })
