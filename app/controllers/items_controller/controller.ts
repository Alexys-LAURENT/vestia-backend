import MediaService from '#services/media_service'
import env from '#start/env'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import { generateObject } from 'ai'
import { ollama } from 'ollama-ai-provider-v2'
import ItemsRepository from '../../repositories/items_repository.js'
import AbstractController from '../abstract_controller.js'
import {
  analyseImageSchema,
  analyseImageValidator,
  getAllItemsValidator,
  insertItemValdator,
} from './validators.js'

@inject()
export default class ItemsController extends AbstractController {
  constructor() {
    super()
  }

  @inject()
  async analyseImage({ request }: HttpContext, mediaService: MediaService) {
    const valid = await request.validateUsing(analyseImageValidator)
    const base64Image = await mediaService.getBase64FromImage(valid.itemImage)

    const result = await generateObject({
      model: ollama(env.get('MODEL_NAME_FOR_ANALYSIS')),
      schema: analyseImageSchema,
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
- Les tags doivent refléter le style, l'occasion de port et l'esthétique générale`,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyse cette image. Détermine d'abord s'il s'agit bien d'un vêtement ou accessoire de mode unique et clairement visible. Si oui, fournis une analyse détaillée. Sinon, indique la raison de l'échec.`,
            },
            {
              type: 'image',
              image: base64Image,
            },
          ],
        },
      ],
    })

    if (!result.object.is_clothing) {
      return {
        success: false,
        message: "L'analyse de l'image a échoué",
        reason: result.object.failure_reason,
      }
    }

    return this.buildJSONResponse({
      message: 'Image analysée avec succès',
      data: result.object.data,
    })
  }

  @inject()
  async insert({ request, auth }: HttpContext, itemsRepository: ItemsRepository) {
    const user = await auth.authenticate()
    const valid = await request.validateUsing(insertItemValdator)
    const newItem = await itemsRepository.insertNewItem(valid, user.idUser)

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
}
