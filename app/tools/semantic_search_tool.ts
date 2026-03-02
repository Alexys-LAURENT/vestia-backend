import { tool } from 'ai'
import { z } from 'zod'
import type { ChatToolContext } from './chat_tool_context.js'

const semanticSearchSchema = z.object({
  query: z.string().describe("Description naturelle de ce que l'utilisateur cherche"),
  limit: z.number().optional().default(10).describe('Nombre de résultats'),
})

export const createSemanticSearchTool = (ctx: ChatToolContext) =>
  tool({
    description:
      'Recherche des vêtements par similarité sémantique avec une description en langage naturel. Idéal pour les requêtes floues : "quelque chose de chaud", "un look streetwear", "tenue pour la plage".',
    inputSchema: semanticSearchSchema,
    execute: async (params) => {
      const queryEmbedding = await ctx.embeddingService.generateEmbedding(params.query)
      const items = await ctx.itemsRepository.searchBySemantic(
        ctx.userId,
        queryEmbedding,
        params.limit ?? 10
      )
      return { items }
    },
  })
