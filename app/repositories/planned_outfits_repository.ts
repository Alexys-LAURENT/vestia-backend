import PlannedOutfit from '#models/planned_outfit'
import { DateTime } from 'luxon'

export default class PlannedOutfitsRepository {
  async create(userId: number, lookId: number, plannedDate: DateTime, notes?: string | null) {
    const plannedOutfit = await PlannedOutfit.create({
      idUser: userId,
      idLook: lookId,
      plannedDate,
      notes: notes ?? null,
    })

    await plannedOutfit.load('look', (lookQuery) => {
      lookQuery.preload('items')
    })

    return plannedOutfit
  }

  async getAllForUser(userId: number, fromDate?: DateTime) {
    const query = PlannedOutfit.query()
      .where('id_user', userId)
      .preload('look', (lookQuery) => {
        lookQuery.preload('items')
      })
      .orderBy('planned_date', 'asc')

    if (fromDate) {
      query.where('planned_date', '>=', fromDate.toSQLDate()!)
    }

    return await query
  }

  async getByDateRange(userId: number, startDate: DateTime, endDate: DateTime) {
    return await PlannedOutfit.query()
      .where('id_user', userId)
      .whereBetween('planned_date', [startDate.toSQLDate()!, endDate.toSQLDate()!])
      .preload('look', (lookQuery) => {
        lookQuery.preload('items')
      })
      .orderBy('planned_date', 'asc')
  }

  async getById(id: number) {
    return await PlannedOutfit.query()
      .where('id_planned_outfit', id)
      .preload('look', (lookQuery) => {
        lookQuery.preload('items')
      })
      .firstOrFail()
  }

  async update(plannedOutfit: PlannedOutfit, data: { plannedDate?: DateTime; notes?: string | null }) {
    if (data.plannedDate) {
      plannedOutfit.plannedDate = data.plannedDate
    }
    if (data.notes !== undefined) {
      plannedOutfit.notes = data.notes
    }

    await plannedOutfit.save()
    await plannedOutfit.load('look', (lookQuery) => {
      lookQuery.preload('items')
    })

    return plannedOutfit
  }

  async delete(id: number) {
    const plannedOutfit = await PlannedOutfit.findOrFail(id)
    await plannedOutfit.delete()
  }
}
