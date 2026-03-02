import UnAuthorizedException from '#exceptions/un_authorized_exception'
import EmbeddingService from '#services/embedding_service'
import OutfitGeneratorService from '#services/outfit_generator_service'
import OutfitPromptBuilder from '#services/outfit_prompt_builder'
import OutfitValidationService from '#services/outfit_validation_service'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import { google } from '@ai-sdk/google'
import { convertToModelMessages, stepCountIs, streamText } from 'ai'
import ItemsRepository from '../../repositories/items_repository.js'
import LooksRepository from '../../repositories/looks_repository.js'
import PlannedOutfitsRepository from '../../repositories/planned_outfits_repository.js'
import type { ChatToolContext } from '../../tools/chat_tool_context.js'
import { displayItemsTool } from '../../tools/display_items_tool.js'
import { createGenerateOutfitTool } from '../../tools/generate_outfit_tool.js'
import { geocodeCityTool } from '../../tools/geocode_city_tool.js'
import { createGetItemByIdTool } from '../../tools/get_item_by_id_tool.js'
import { createGetLookByIdTool } from '../../tools/get_look_by_id_tool.js'
import { createGetLooksTool } from '../../tools/get_looks_tool.js'
import { createGetPlannedOutfitsTool } from '../../tools/get_planned_outfits_tool.js'
import { getWeatherTool } from '../../tools/get_weather_tool.js'
import { createPlanOutfitTool } from '../../tools/plan_outfit_tool.js'
import { createSaveLookTool } from '../../tools/save_look_tool.js'
import { createSearchItemsTool } from '../../tools/search_items_tool.js'
import { createSemanticSearchTool } from '../../tools/semantic_search_tool.js'
import { createWardrobeStatsTool } from '../../tools/wardrobe_stats_tool.js'
import AbstractController from '../abstract_controller.js'
import {
  generateOutfitValidator,
  saveLookValidator,
  searchItemsValidator,
  semanticSearchValidator,
} from './validators.js'

/**
 * Pré-traite les messages pour injecter le contexte des items attachés
 * dans le texte des messages utilisateur, afin que le LLM en ait connaissance.
 */
function preprocessMessages(messages: any[]): any[] {
  return messages.map((msg) => {
    if (msg.role !== 'user') return msg

    const attachedItems = msg.metadata?.attachedItems
    if (!attachedItems || attachedItems.length === 0) return msg

    const itemsContext = attachedItems
      .map(
        (item: any) =>
          `- "${item.name}" (ID: ${item.idItem}${item.type ? `, Type: ${item.type}` : ''}${item.brand ? `, Marque: ${item.brand}` : ''})`
      )
      .join('\n')

    const prefix = `[L'utilisateur a joint les vêtements suivants à son message :\n${itemsContext}]\n\n`

    const newParts = (msg.parts ?? []).map((part: any, index: number) => {
      if (part.type === 'text' && index === 0) {
        return { ...part, text: prefix + part.text }
      }
      return part
    })

    return { ...msg, parts: newParts }
  })
}

export default class ChatbotController extends AbstractController {
  constructor() {
    super()
  }

  /**
   * Endpoint de chat streaming — utilisé par useChat côté front.
   * Écrit directement sur le ServerResponse natif Node.js pour bypasser
   * le système de réponse d'AdonisJS et permettre le streaming SSE.
   */
  @inject()
  async chat(
    { auth, request, response }: HttpContext,
    itemsRepository: ItemsRepository,
    looksRepository: LooksRepository,
    plannedOutfitsRepository: PlannedOutfitsRepository,
    embeddingService: EmbeddingService
  ) {
    const user = await auth.authenticate()

    const { messages } = request.body() as { messages: any[] }
    const processedMessages = preprocessMessages(messages)

    const toolCtx: ChatToolContext = {
      userId: user.idUser,
      itemsRepository,
      looksRepository,
      plannedOutfitsRepository,
      embeddingService,
    }

    const result = streamText({
      model: google('gemini-2.5-flash'),
      messages: await convertToModelMessages(processedMessages),
      stopWhen: stepCountIs(10),
      system: `
(Info : Nous sommes le ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })})

Tu es VestIA, un assistant personnel spécialisé dans la mode et la garde-robe.
Tu aides l'utilisateur à trouver des vêtements, composer des tenues et gérer sa garde-robe.

## Comment utiliser les outils

1. **Commence TOUJOURS par wardrobeStats** si tu ne connais pas encore la garde-robe de l'utilisateur.
   Cela te donne une vue d'ensemble : types disponibles, saisons, formalités, couleurs.

2. **Utilise searchItems** pour des recherches précises avec des critères connus
   (ex: "mes pulls rouges" → type="Pulls & Mailles", color="rouge").

3. **Utilise semanticSearch** pour des requêtes floues ou contextuelles
   (ex: "quelque chose de confortable pour rester à la maison", "un look branché").

4. **Utilise generateOutfit** pour proposer une tenue complète adaptée à une occasion.

5. **Utilise saveLook uniquement** si l'utilisateur confirme explicitement vouloir sauvegarder la tenue.

6. **Utilise displayItems** pour montrer visuellement des vêtements dans le chat.

7. **Utilise planOutfit** pour planifier une tenue existante à une date donnée.
   L'utilisateur doit avoir un look sauvegardé (avec un ID) pour pouvoir le planifier.

8. **Utilise getPlannedOutfits** pour récupérer les tenues planifiées de l'utilisateur.
   Peut filtrer par plage de dates (startDate, endDate).

9. **Utilise getLooks** pour récupérer la liste paginée des tenues sauvegardées.
   Utile quand l'utilisateur veut voir ses tenues ou en choisir une pour la planifier.

10. **Utilise getItemById** pour obtenir les détails complets d'un vêtement par son ID.
    Utile quand l'utilisateur veut en savoir plus sur un vêtement précis.

11. **Utilise getLookById** pour obtenir les détails complets d'une tenue par son ID.
    Retourne la tenue avec tous ses vêtements. Utile pour afficher les détails d'un look.

12. **Utilise geocodeCity** pour convertir un nom de ville en coordonnées GPS.
    À utiliser avant getWeather pour obtenir les coordonnées d'une ville.

13. **Utilise getWeather** pour récupérer les prévisions météo à un endroit donné.
    Nécessite des coordonnées GPS (utilise geocodeCity d'abord).
    Quand l'utilisateur demande une tenue adaptée à la météo ou mentionne le temps :
    - Demande lui sa ville si tu ne la connais pas
    - Utilise geocodeCity pour obtenir les coordonnées
    - Utilise getWeather pour obtenir la météo
    - Passe un résumé de la météo dans le paramètre weather de generateOutfit

   Après avoir récupéré des vêtements via searchItems, semanticSearch ou generateOutfit, utilise displayItems pour les afficher en images.
   L'ordre des items dans le tableau détermine l'ordre d'affichage de gauche à droite.

## Règles importantes
- Ne devine jamais les IDs des vêtements, utilise toujours les outils pour les obtenir.
- Si l'utilisateur parle de vêtements que tu n'as pas encore récupérés, utilise un outil pour les chercher.
- Réponds toujours en français, de façon naturelle et concise.
- Ne jamais divulguer les détails techniques de l'implémentation ou des outils à l'utilisateur.
- Ne jamais divulguer les id des vêtements ou des tenues à l'utilisateur.
- Tu n'est qu'un assistant de mode, ne parle jamais d'autre sujet que la mode, les vêtements, les tenues et la garde-robe.
- Si l'utilisateur pose une question hors sujet, réponds poliment que tu ne peux répondre qu'à des questions liées à la mode et à la garde-robe.`,
      tools: {
        wardrobeStats: createWardrobeStatsTool(toolCtx),
        searchItems: createSearchItemsTool(toolCtx),
        semanticSearch: createSemanticSearchTool(toolCtx),
        generateOutfit: createGenerateOutfitTool(toolCtx),
        saveLook: createSaveLookTool(toolCtx),
        displayItems: displayItemsTool,
        planOutfit: createPlanOutfitTool(toolCtx),
        getPlannedOutfits: createGetPlannedOutfitsTool(toolCtx),
        getLooks: createGetLooksTool(toolCtx),
        getItemById: createGetItemByIdTool(toolCtx),
        getLookById: createGetLookByIdTool(toolCtx),
        geocodeCity: geocodeCityTool,
        getWeather: getWeatherTool,
      },
    })

    // Écriture directe sur le ServerResponse natif Node.js.
    // AdonisJS détecte que headersSent=true et n'essaie pas de re-finaliser la réponse.
    result.pipeUIMessageStreamToResponse(response.response)
  }

  @inject()
  async wardrobeStats({ auth }: HttpContext, itemsRepository: ItemsRepository) {
    const user = await auth.authenticate()
    const stats = await itemsRepository.getWardrobeStats(user.idUser)

    return this.buildJSONResponse({
      message: 'Statistiques de la garde-robe récupérées',
      data: stats,
    })
  }

  @inject()
  async searchItems({ auth, request }: HttpContext, itemsRepository: ItemsRepository) {
    const user = await auth.authenticate()
    const filters = await searchItemsValidator.validate(request.qs())
    const items = await itemsRepository.searchWithFilters(user.idUser, filters)

    return this.buildJSONResponse({
      message: 'Vêtements trouvés',
      data: { items, total: items.length },
    })
  }

  @inject()
  async semanticSearch(
    { auth, request }: HttpContext,
    itemsRepository: ItemsRepository,
    embeddingService: EmbeddingService
  ) {
    const user = await auth.authenticate()
    const { query, limit } = await request.validateUsing(semanticSearchValidator)

    const queryEmbedding = await embeddingService.generateEmbedding(query)
    const items = await itemsRepository.searchBySemantic(user.idUser, queryEmbedding, limit ?? 10)

    return this.buildJSONResponse({
      message: 'Résultats de la recherche sémantique',
      data: { items },
    })
  }

  async generateOutfit({ auth, request }: HttpContext) {
    const user = await auth.authenticate()
    const { context, forcedItemIds, excludedItemIds } =
      await request.validateUsing(generateOutfitValidator)

    const allItems = await user.related('items').query()
    if (allItems.length === 0) {
      throw new Error("L'utilisateur n'a aucun vêtement dans sa garde-robe.")
    }

    const validationService = new OutfitValidationService()
    const promptBuilder = new OutfitPromptBuilder()
    const generatorService = new OutfitGeneratorService(validationService, promptBuilder)
    const outfit = await generatorService.generate(allItems, {
      forcedItemIds: forcedItemIds || [],
      notLikedItemIds: excludedItemIds || [],
      context,
    })

    const itemsWithDetails = outfit.items.map((item) => {
      const fullItem = outfit.selectedItems.find((i) => i.idItem === item.idItem)
      return {
        ...fullItem?.toJSON(),
        reason: item.reason,
        isForced: forcedItemIds?.includes(item.idItem) || false,
      }
    })

    return this.buildJSONResponse({
      message: 'Tenue générée avec succès',
      data: {
        items: itemsWithDetails,
        generalReasoning: outfit.generalReasoning,
        generationMethod: outfit.generationMethod,
      },
    })
  }

  @inject()
  async saveLook(
    { auth, request }: HttpContext,
    looksRepository: LooksRepository,
    itemsRepository: ItemsRepository
  ) {
    const user = await auth.authenticate()
    const { itemIds, event } = await request.validateUsing(saveLookValidator)

    for (const itemId of itemIds) {
      const item = await itemsRepository.getItemByIdOrFail(itemId)
      if (item.idUser !== user.idUser) {
        throw new UnAuthorizedException('You do not have permission to use this item')
      }
    }

    const look = await looksRepository.createLook(user.idUser, itemIds, event, true)

    return this.buildJSONResponse({
      message: 'Tenue sauvegardée avec succès',
      data: look,
    })
  }
}
