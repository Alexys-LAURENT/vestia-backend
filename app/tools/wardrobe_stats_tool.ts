import { tool } from 'ai'
import { z } from 'zod'
import type { ChatToolContext } from './chat_tool_context.js'

const wardrobeStatsSchema = z.object({})

export const createWardrobeStatsTool = (ctx: ChatToolContext) =>
  tool({
    description:
      "Récupère les statistiques complètes de la garde-robe de l'utilisateur : nombre total de vêtements, répartition par type, saison et formalité, et la liste des couleurs disponibles avec le nombre de pièces par couleur. À appeler en premier pour comprendre le contexte.",
    inputSchema: wardrobeStatsSchema,
    execute: async () => {
      return ctx.itemsRepository.getWardrobeStats(ctx.userId)
    },
  })
