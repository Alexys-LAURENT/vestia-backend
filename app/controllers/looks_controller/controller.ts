import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import ItemsRepository from '../../repositories/items_repository.js'
import LooksRepository from '../../repositories/looks_repository.js'
import AbstractController from '../abstract_controller.js'
import UnAuthorizedException from '#exceptions/un_authorized_exception'
import { createLookValidator, getAllLooksValidator, onlyIdLookValidator } from './validators.js'

export default class LooksController extends AbstractController {
  constructor() {
    super()
  }

  @inject()
  async getAllForUser({ auth, request }: HttpContext, looksRepository: LooksRepository) {
    const user = await auth.authenticate()
    const { limit, page } = await getAllLooksValidator.validate(request.qs())

    const items = await looksRepository.getAllItemsForOneUserWithPaginated(user.idUser, limit, page)

    return this.buildJSONResponse({
      message: 'Tenues récupérés avec succès',
      data: items,
    })
  }

  @inject()
  async create(
    { auth, request }: HttpContext,
    looksRepository: LooksRepository,
    itemsRepository: ItemsRepository
  ) {
    const user = await auth.authenticate()
    const { itemIds, event, isAiGenerated } = await request.validateUsing(createLookValidator)

    // Verify that all items belong to the user
    for (const itemId of itemIds) {
      const item = await itemsRepository.getItemByIdOrFail(itemId)
      if (item.idUser !== user.idUser) {
        throw new UnAuthorizedException('You do not have permission to use this item')
      }
    }

    const look = await looksRepository.createLook(user.idUser, itemIds, event, isAiGenerated ?? true)

    return this.buildJSONResponse({
      message: 'Tenue sauvegardée avec succès',
      data: look,
    })
  }

  @inject()
  async generateLook({ auth, request }: HttpContext) {
    const user = await auth.authenticate()
    const { forcedItemIds, notLikedLookItemsIds } =
      await request.validateUsing(generateLookValidator)

    // Fetch user's wardrobe
    const allItems = await user.related('items').query()

    if (allItems.length === 0) {
      throw new Error("L'utilisateur n'a aucun vêtement dans sa garde-robe.")
    }

    // Generate outfit using the service
    const validationService = new OutfitValidationService()
    const promptBuilder = new OutfitPromptBuilder()
    const generatorService = new OutfitGeneratorService(validationService, promptBuilder)

    const outfit = await generatorService.generate(allItems, {
      forcedItemIds: forcedItemIds || [],
      notLikedItemIds: notLikedLookItemsIds || [],
    })

    // Format response
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
        forcedItemsCount: forcedItemIds?.length || 0,
      },
    })
  }

  @inject()
  async getOne({ auth, params }: HttpContext, looksRepository: LooksRepository) {
    const user = await auth.authenticate()
    const { idLook } = await onlyIdLookValidator.validate(params)

    const look = await looksRepository.getLookByIdOrFail(idLook)

    // Verify ownership
    if (look.idUser !== user.idUser) {
      throw new UnAuthorizedException('You do not have permission to view this look')
    }

    return this.buildJSONResponse({
      message: 'Tenue récupérée avec succès',
      data: look,
    })
  }

  @inject()
  async delete({ auth, params }: HttpContext, looksRepository: LooksRepository) {
    const user = await auth.authenticate()
    const { idLook } = await onlyIdLookValidator.validate(params)

    const look = await looksRepository.getLookByIdOrFail(idLook)

    // Verify ownership
    if (look.idUser !== user.idUser) {
      throw new UnAuthorizedException('You do not have permission to delete this look')
    }

    await look.delete()

    return this.buildJSONResponse({
      message: 'Tenue supprimée avec succès',
    })
  }
}
