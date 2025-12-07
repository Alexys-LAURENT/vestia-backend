import MediaService from '#services/media_service'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import { generateObject } from 'ai'
import { ollama } from 'ollama-ai-provider-v2'
import AbstractController from '../abstract_controller.js'
import { analyseImageSchema, analyseImageValidator } from './validator.js'

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
      model: ollama('qwen3-vl:4b'),
      schema: analyseImageSchema,
      providerOptions: { ollama: { think: false } },
      system: `
        Tu es un spécialiste de la mode et un assistant IA qui aide à analyser des images de vêtements 
        afin d'extraire des informations détaillées sur chaque vêtement.
        Lorsque tu reçois une image, tu dois identifier le vêtement et fournir les informations comme il t'est indiqué dans le schéma.
        Tu dois ABSOLUMENT répondre en français.
        `,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Voici l'image à analyser.`,
            },
            {
              type: 'image',
              image: base64Image,
            },
          ],
        },
      ],
    })

    return this.buildJSONResponse({ message: 'Image analysed', data: result.object })
  }
}
