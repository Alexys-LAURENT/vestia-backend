import { tool } from 'ai'
import { z } from 'zod'
import type { ChatToolContext } from './chat_tool_context.js'

const saveLookSchema = z.object({
  itemIds: z
    .array(z.number())
    .min(2)
    .max(6)
    .describe('IDs des vêtements qui composent la tenue (2 à 6 pièces)'),
  event: z.string().optional().describe("Nom de l'occasion ou de l'événement associé à la tenue"),
})

export const createSaveLookTool = (ctx: ChatToolContext) =>
  tool({
    description:
      "Sauvegarde définitivement une tenue dans la garde-robe de l'utilisateur. N'appelle cet outil QUE si l'utilisateur confirme explicitement vouloir sauvegarder.",
    inputSchema: saveLookSchema,
    execute: async (params) => {
      // Vérifier que tous les items appartiennent à l'utilisateur
      for (const itemId of params.itemIds) {
        const item = await ctx.itemsRepository.getItemByIdOrFail(itemId)
        if (item.idUser !== ctx.userId) {
          return { error: 'Un des vêtements ne vous appartient pas.' }
        }
      }

      const look = await ctx.looksRepository.createLook(
        ctx.userId,
        params.itemIds,
        params.event,
        true
      )

      return { look: look.toJSON() }
    },
  })
