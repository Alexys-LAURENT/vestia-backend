import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import LooksRepository from '../../repositories/looks_repository.js'
import AbstractController from '../abstract_controller.js'
import { getAllLooksValidator } from './validators.js'

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
}
