import Look from '#models/look'
import db from '@adonisjs/lucid/services/db'

export default class LooksRepository {
  async getAllItemsForOneUserWithPaginated(idUser: number, limit?: number, page?: number) {
    const query = Look.query().where('id_user', idUser).preload('items')

    const items = await query.paginate(page ?? 1, limit ?? 20)
    return items
  }

  async createLook(
    userId: number,
    itemIds: number[],
    event?: string | null,
    isAiGenerated: boolean = true
  ) {
    const look = await db.transaction(async (trx) => {
      const newLook = await Look.create(
        {
          idUser: userId,
          event: event ?? null,
          avatarImageUrl: null,
          isAiGenerated,
        },
        { client: trx }
      )

      await newLook.useTransaction(trx).related('items').attach(itemIds)

      return newLook
    })

    await look.load('items')
    return look
  }

  async searchLooks(
    idUser: number,
    filters: {
      event?: string
      itemName?: string
      itemType?: string
      itemIds?: number[]
      isAiGenerated?: boolean
      limit?: number
    } = {}
  ) {
    const query = Look.query().where('id_user', idUser).preload('items')

    if (filters.event) {
      query.whereILike('event', `%${filters.event}%`)
    }

    if (filters.isAiGenerated !== undefined) {
      query.where('is_ai_generated', filters.isAiGenerated)
    }

    if (filters.itemName || filters.itemType) {
      query.whereHas('items', (itemQuery) => {
        if (filters.itemName) {
          itemQuery.whereILike('name', `%${filters.itemName}%`)
        }
        if (filters.itemType) {
          itemQuery.where('type', filters.itemType)
        }
      })
    }

    if (filters.itemIds && filters.itemIds.length > 0) {
      for (const itemId of filters.itemIds) {
        query.whereHas('items', (itemQuery) => {
          itemQuery.where('id_item', itemId)
        })
      }
    }

    return query.orderBy('created_at', 'desc').limit(filters.limit ?? 20)
  }

  async getLookByIdOrFail(idLook: number) {
    const look = await Look.query().where('id_look', idLook).preload('items').firstOrFail()
    return look
  }
}
