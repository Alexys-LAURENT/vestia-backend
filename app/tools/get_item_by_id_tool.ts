import { tool } from 'ai'
import { z } from 'zod'
import type { ChatToolContext } from './chat_tool_context.js'

const getItemByIdSchema = z.object({
  id: z.number().describe("L'identifiant unique du vêtement à récupérer"),
})

export const createGetItemByIdTool = (ctx: ChatToolContext) =>
  tool({
    description:
      "Récupère les détails complets d'un vêtement par son ID. Utilise cet outil quand l'utilisateur veut voir les détails d'un vêtement spécifique (type, saison, formalité, couleurs, marque, description, tags, etc.).",
    inputSchema: getItemByIdSchema,
    execute: async (params) => {
      const item = await ctx.itemsRepository.getItemByIdOrFail(params.id)
      return { item: item.toJSON() }
    },
  })
