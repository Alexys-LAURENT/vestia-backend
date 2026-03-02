import Item from '#models/item'
import OutfitGeneratorService from '#services/outfit_generator_service'
import OutfitPromptBuilder from '#services/outfit_prompt_builder'
import OutfitValidationService from '#services/outfit_validation_service'
import { tool } from 'ai'
import { z } from 'zod'
import type { ChatToolContext } from './chat_tool_context.js'

const generateOutfitSchema = z.object({
  context: z
    .string()
    .optional()
    .describe(
      'Contexte ou occasion (ex: "entretien d\'embauche", "soirée entre amis", "journée détente")'
    ),
  weather: z
    .string()
    .optional()
    .describe(
      "Résumé des conditions météo à prendre en compte pour la tenue (ex: '15°C, pluie légère, vent modéré'). Si disponible, sera ajouté au contexte pour adapter la tenue."
    ),
  forcedItemIds: z
    .array(z.number())
    .optional()
    .describe('IDs des vêtements à inclure obligatoirement dans la tenue'),
  excludedItemIds: z
    .array(z.number())
    .optional()
    .describe('IDs des vêtements à exclure de la tenue'),
})

export const createGenerateOutfitTool = (ctx: ChatToolContext) =>
  tool({
    description:
      "Génère une proposition de tenue complète et cohérente adaptée à un contexte ou une occasion. Peut imposer certains vêtements ou en exclure d'autres. IMPORTANT : Avant de générer une tenue, DEMANDE à l'utilisateur s'il souhaite prendre en compte la météo pour un endroit en particulier (QUESTION OUI OU NON). Si oui, utilise d'abord geocodeCity puis getWeather pour récupérer la météo, et passe le résumé dans le paramètre weather.",
    inputSchema: generateOutfitSchema,
    execute: async (params) => {
      const allItems = await Item.query().where('id_user', ctx.userId)
      if (allItems.length === 0) {
        return { error: "L'utilisateur n'a aucun vêtement dans sa garde-robe." }
      }

      let context = params.context ?? ''
      if (params.weather) {
        context = context ? `${context} | Météo : ${params.weather}` : `Météo : ${params.weather}`
      }

      const validationService = new OutfitValidationService()
      const promptBuilder = new OutfitPromptBuilder()
      const generatorService = new OutfitGeneratorService(validationService, promptBuilder)

      const outfit = await generatorService.generate(allItems, {
        forcedItemIds: params.forcedItemIds || [],
        notLikedItemIds: params.excludedItemIds || [],
        context: context || undefined,
      })

      const itemsWithDetails = outfit.items.map((item) => {
        const fullItem = outfit.selectedItems.find((i) => i.idItem === item.idItem)
        return {
          ...fullItem?.toJSON(),
          reason: item.reason,
          isForced: params.forcedItemIds?.includes(item.idItem) || false,
        }
      })

      return {
        items: itemsWithDetails,
        generalReasoning: outfit.generalReasoning,
        generationMethod: outfit.generationMethod,
      }
    },
  })
