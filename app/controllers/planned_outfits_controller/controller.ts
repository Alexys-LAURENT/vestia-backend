import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import PlannedOutfitsRepository from '../../repositories/planned_outfits_repository.js'
import LooksRepository from '../../repositories/looks_repository.js'
import AbstractController from '../abstract_controller.js'
import UnAuthorizedException from '#exceptions/un_authorized_exception'
import {
  createPlannedOutfitValidator,
  updatePlannedOutfitValidator,
  getPlannedOutfitsValidator,
  onlyIdPlannedOutfitValidator,
} from './validators.js'
import { DateTime } from 'luxon'

export default class PlannedOutfitsController extends AbstractController {
  constructor() {
    super()
  }

  @inject()
  async create(
    { auth, request }: HttpContext,
    plannedOutfitsRepository: PlannedOutfitsRepository,
    looksRepository: LooksRepository
  ) {
    const user = await auth.authenticate()
    const { lookId, plannedDate, notes } = await request.validateUsing(createPlannedOutfitValidator)

    // Verify that the look belongs to the user
    const look = await looksRepository.getLookByIdOrFail(lookId)
    if (look.idUser !== user.idUser) {
      throw new UnAuthorizedException('You do not have permission to plan this look')
    }

    const plannedOutfit = await plannedOutfitsRepository.create(
      user.idUser,
      lookId,
      DateTime.fromISO(plannedDate),
      notes
    )

    return this.buildJSONResponse({
      message: 'Tenue planifiée avec succès',
      data: plannedOutfit,
    })
  }

  @inject()
  async getAll({ auth, request }: HttpContext, plannedOutfitsRepository: PlannedOutfitsRepository) {
    const user = await auth.authenticate()
    const { startDate, endDate } = await getPlannedOutfitsValidator.validate(request.qs())

    let plannedOutfits
    if (startDate && endDate) {
      plannedOutfits = await plannedOutfitsRepository.getByDateRange(
        user.idUser,
        DateTime.fromISO(startDate),
        DateTime.fromISO(endDate)
      )
    } else if (startDate) {
      plannedOutfits = await plannedOutfitsRepository.getAllForUser(
        user.idUser,
        DateTime.fromISO(startDate)
      )
    } else {
      plannedOutfits = await plannedOutfitsRepository.getAllForUser(user.idUser)
    }

    return this.buildJSONResponse({
      message: 'Tenues planifiées récupérées avec succès',
      data: plannedOutfits,
    })
  }

  @inject()
  async getOne({ auth, params }: HttpContext, plannedOutfitsRepository: PlannedOutfitsRepository) {
    const user = await auth.authenticate()
    const { idPlannedOutfit } = await onlyIdPlannedOutfitValidator.validate(params)

    const plannedOutfit = await plannedOutfitsRepository.getById(idPlannedOutfit)

    // Verify ownership
    if (plannedOutfit.idUser !== user.idUser) {
      throw new UnAuthorizedException('You do not have permission to view this planned outfit')
    }

    return this.buildJSONResponse({
      message: 'Tenue planifiée récupérée avec succès',
      data: plannedOutfit,
    })
  }

  @inject()
  async update(
    { auth, params, request }: HttpContext,
    plannedOutfitsRepository: PlannedOutfitsRepository
  ) {
    const user = await auth.authenticate()
    const { idPlannedOutfit } = await onlyIdPlannedOutfitValidator.validate(params)
    const updateData = await request.validateUsing(updatePlannedOutfitValidator)

    const plannedOutfit = await plannedOutfitsRepository.getById(idPlannedOutfit)

    // Verify ownership
    if (plannedOutfit.idUser !== user.idUser) {
      throw new UnAuthorizedException('You do not have permission to update this planned outfit')
    }

    const updatedPlannedOutfit = await plannedOutfitsRepository.update(plannedOutfit, {
      plannedDate: updateData.plannedDate ? DateTime.fromISO(updateData.plannedDate) : undefined,
      notes: updateData.notes,
    })

    return this.buildJSONResponse({
      message: 'Tenue planifiée mise à jour avec succès',
      data: updatedPlannedOutfit,
    })
  }

  @inject()
  async delete({ auth, params }: HttpContext, plannedOutfitsRepository: PlannedOutfitsRepository) {
    const user = await auth.authenticate()
    const { idPlannedOutfit } = await onlyIdPlannedOutfitValidator.validate(params)

    const plannedOutfit = await plannedOutfitsRepository.getById(idPlannedOutfit)

    // Verify ownership
    if (plannedOutfit.idUser !== user.idUser) {
      throw new UnAuthorizedException('You do not have permission to delete this planned outfit')
    }

    await plannedOutfitsRepository.delete(idPlannedOutfit)

    return this.buildJSONResponse({
      message: 'Tenue planifiée supprimée avec succès',
    })
  }
}
