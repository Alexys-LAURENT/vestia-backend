import UnAuthorizedException from '#exceptions/un_authorized_exception'
import EmbeddingService from '#services/embedding_service'
import OutfitGeneratorService from '#services/outfit_generator_service'
import OutfitPromptBuilder from '#services/outfit_prompt_builder'
import OutfitValidationService from '#services/outfit_validation_service'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import ItemsRepository from '../../repositories/items_repository.js'
import LooksRepository from '../../repositories/looks_repository.js'
import AbstractController from '../abstract_controller.js'
import {
  generateOutfitValidator,
  saveLookValidator,
  searchItemsValidator,
  semanticSearchValidator,
} from './validators.js'

export default class ChatbotController extends AbstractController {
  constructor() {
    super()
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
