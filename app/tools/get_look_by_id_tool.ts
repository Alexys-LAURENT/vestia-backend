import { tool } from 'ai'
import { z } from 'zod'
import type { ChatToolContext } from './chat_tool_context.js'

const getLookByIdSchema = z.object({
  id: z.number().describe("L'identifiant unique de la tenue (look) à récupérer"),
})

export const createGetLookByIdTool = (ctx: ChatToolContext) =>
  tool({
    description:
      "Récupère les détails complets d'une tenue (look) par son ID, y compris tous les vêtements qui la composent. Utilise cet outil quand l'utilisateur veut voir les détails d'une tenue spécifique.",
    inputSchema: getLookByIdSchema,
    execute: async (params) => {
      const look = await ctx.looksRepository.getLookByIdOrFail(params.id)
      return { look: look.toJSON() }
    },
  })
