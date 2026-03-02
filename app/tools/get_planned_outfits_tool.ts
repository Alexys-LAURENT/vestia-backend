import { tool } from 'ai'
import { DateTime } from 'luxon'
import { z } from 'zod'
import type { ChatToolContext } from './chat_tool_context.js'

const getPlannedOutfitsSchema = z.object({
  startDate: z
    .string()
    .optional()
    .describe(
      "Date de début au format ISO 8601 pour filtrer les tenues planifiées (ex: '2026-03-01T00:00:00.000Z')"
    ),
  endDate: z
    .string()
    .optional()
    .describe(
      "Date de fin au format ISO 8601 pour filtrer les tenues planifiées (ex: '2026-03-31T23:59:59.999Z')"
    ),
})

export const createGetPlannedOutfitsTool = (ctx: ChatToolContext) =>
  tool({
    description:
      "Récupère les tenues planifiées de l'utilisateur, avec possibilité de filtrer par plage de dates. Utilise cet outil quand l'utilisateur veut voir ses tenues prévues, son planning vestimentaire ou ce qu'il a prévu de porter.",
    inputSchema: getPlannedOutfitsSchema,
    execute: async (params) => {
      if (params.startDate && params.endDate) {
        const start = DateTime.fromISO(params.startDate)
        const end = DateTime.fromISO(params.endDate)
        if (start.isValid && end.isValid) {
          const outfits = await ctx.plannedOutfitsRepository.getByDateRange(ctx.userId, start, end)
          return { plannedOutfits: outfits.map((o) => o.toJSON()) }
        }
      }

      const fromDate = params.startDate ? DateTime.fromISO(params.startDate) : undefined
      const outfits = await ctx.plannedOutfitsRepository.getAllForUser(
        ctx.userId,
        fromDate?.isValid ? fromDate : undefined
      )
      return { plannedOutfits: outfits.map((o) => o.toJSON()) }
    },
  })
