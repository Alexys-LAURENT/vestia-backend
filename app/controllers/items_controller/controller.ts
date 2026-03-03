import UnAuthorizedException from '#exceptions/un_authorized_exception'
import EmbeddingService from '#services/embedding_service'
import MediaService from '#services/media_service'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import { google } from '@ai-sdk/google'
import { generateText, Output, UserContent } from 'ai'
import ItemsRepository from '../../repositories/items_repository.js'
import AbstractController from '../abstract_controller.js'
import {
  analyseImagesSchema,
  analyseImageValidator,
  getAllItemsValidator,
  insertItemValdator,
  onlyIdItemValidator,
  updateItemValdator,
} from './validators.js'

@inject()
export default class ItemsController extends AbstractController {
  constructor() {
    super()
  }

  @inject()
  async analyseImage({ request }: HttpContext, mediaService: MediaService) {
    const valid = await request.validateUsing(analyseImageValidator)

    if (valid.images.length === 0) {
      throw new Error("Aucune image fournie pour l'analyse")
    }

    const base64Images = await Promise.all(
      valid.images.map((image) => mediaService.getBase64FromImage(image))
    )

    const imagesMessages: UserContent = base64Images.map((base64) => ({
      type: 'image',
      image: base64,
    }))

    const result = await generateText({
      model: google('gemini-2.5-flash'),
      output: Output.object({
        schema: analyseImagesSchema,
        name: 'analyse_image_response',
      }),
      providerOptions: { ollama: { think: false } },
      system: `Tu es un expert en mode et stylisme avec une connaissance approfondie des vêtements, des tendances et des styles vestimentaires.

## Ta mission
Analyser des images pour identifier et décrire des vêtements ou accessoires de mode.

## Règles importantes
1. **Validation de l'image** : Avant toute analyse, vérifie que l'image contient bien UN SEUL vêtement ou accessoire de mode clairement visible.
2. **Cas d'échec** (is_clothing = false) :
   - L'image ne contient pas de vêtement (objet, paysage, nourriture, etc.)
   - L'image contient plusieurs vêtements distincts
   - L'image est trop floue ou de mauvaise qualité
   - Le vêtement n'est pas suffisamment visible
3. **Cas de succès** (is_clothing = true) : Remplis toutes les informations demandées avec précision.

## Consignes de réponse
- Réponds UNIQUEMENT en français
- Sois précis et descriptif dans tes analyses
- Utilise un vocabulaire mode approprié
- Pour les couleurs, utilise des noms précis ("bleu marine" plutôt que "bleu")
- Les tags doivent refléter le style, l'occasion de port et l'esthétique générale et être en français`,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyse cette image. Détermine d'abord s'il s'agit bien d'un vêtement ou accessoire de mode unique et clairement visible. Si oui, fournis une analyse détaillée. Sinon, indique la raison de l'échec.`,
            },
            ...imagesMessages,
          ],
        },
      ],
    })

    const allItemWhereIsClothingTrue = result.output.results.filter((item) => item.is_clothing)

    if (allItemWhereIsClothingTrue.length === 0) {
      return {
        success: false,
        message: "L'analyse de l'image a échoué",
        reason:
          'Aucune des images soumises ne contient un vêtement ou accessoire de mode unique et clairement visible.',
      }
    }

    return this.buildJSONResponse({
      message: 'Image analysée avec succès',
      data: allItemWhereIsClothingTrue.map((item) => item.data),
    })
  }

  @inject()
  async insert(
    { request, auth }: HttpContext,
    itemsRepository: ItemsRepository,
    embeddingService: EmbeddingService
  ) {
    const user = await auth.authenticate()
    const valid = await request.validateUsing(insertItemValdator)
    const newItem = await itemsRepository.insertNewItem(valid, user.idUser)

    embeddingService
      .generateItemEmbedding(newItem)
      .then((embedding) => itemsRepository.updateEmbedding(newItem.idItem, embedding))
      .catch((err) =>
        logger.error(
          `Échec de la génération d'embedding pour l'item ${newItem.idItem}: ${err.message}`
        )
      )

    return this.buildJSONResponse({
      message: 'Vêtement ajouté avec succès',
      data: newItem,
    })
  }

  @inject()
  async getAllForUser({ auth, request }: HttpContext, itemsRepository: ItemsRepository) {
    const user = await auth.authenticate()
    const { limit, page, search, type } = await getAllItemsValidator.validate(request.qs())

    const items = await itemsRepository.getAllItemsForOneUserWithPaginatedAndFilters(
      user.idUser,
      limit,
      page,
      search,
      type
    )

    return this.buildJSONResponse({
      message: 'Vêtements récupérés avec succès',
      data: items,
    })
  }

  @inject()
  async getOne({ auth, params }: HttpContext, itemsRepository: ItemsRepository) {
    const user = await auth.authenticate()
    const { idItem } = await onlyIdItemValidator.validate(params)
    const item = await itemsRepository.getItemByIdOrFail(idItem)

    if (item.idUser !== user.idUser) {
      throw new UnAuthorizedException()
    }

    return this.buildJSONResponse({
      message: 'Vêtement récupéré avec succès',
      data: item,
    })
  }

  @inject()
  async delete({ auth, params }: HttpContext, itemsRepository: ItemsRepository) {
    const user = await auth.authenticate()
    const { idItem } = await onlyIdItemValidator.validate(params)
    const item = await itemsRepository.getItemByIdOrFail(idItem)

    if (item.idUser !== user.idUser) {
      throw new UnAuthorizedException()
    }
    await itemsRepository.deleteItemById(idItem)

    return this.buildJSONResponse({
      message: 'Vêtement supprimé avec succès',
    })
  }

  @inject()
  async update(
    { params, request, auth }: HttpContext,
    itemsRepository: ItemsRepository,
    embeddingService: EmbeddingService
  ) {
    const user = await auth.authenticate()
    const { idItem } = await onlyIdItemValidator.validate(params)

    const item = await itemsRepository.getItemByIdOrFail(idItem)
    if (item.idUser !== user.idUser) {
      throw new UnAuthorizedException()
    }

    const valid = await request.validateUsing(updateItemValdator)

    await itemsRepository.updateItem(item, valid)

    embeddingService
      .generateItemEmbedding(item)
      .then((embedding) => itemsRepository.updateEmbedding(item.idItem, embedding))
      .catch((err) =>
        logger.error(`Embedding update failed for item ${item.idItem}: ${err.message}`)
      )

    return this.buildJSONResponse({
      message: 'Vêtement mis à jour avec succès',
      data: item,
    })
  }
}
