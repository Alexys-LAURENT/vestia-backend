import Item from '#models/item'
import { MultipartFile } from '@adonisjs/core/types/bodyparser'
import db from '@adonisjs/lucid/services/db'

export default class ItemsRepository {
  async getAllItemsForOneUserWithPaginatedAndFilters(
    idUser: number,
    limit?: number,
    page?: number,
    search?: string,
    type?: string
  ) {
    const query = Item.query().where('id_user', idUser)

    if (type) {
      query.andWhere('type', type)
    }

    if (search) {
      query.andWhere((builder) => {
        builder.whereILike('name', `%${search}%`).orWhereILike('description', `%${search}%`)
      })
    }

    const items = await query.paginate(page ?? 1, limit ?? 20)
    return items
  }

  async insertNewItem(itemData: Partial<Item> & { image: MultipartFile }, idUser: number) {
    const newItem = await db.transaction(async (trx) => {
      const item = await Item.create(
        {
          idUser: idUser,
          name: itemData.name,
          description: itemData.description,
          tags: itemData.tags,
          imageUrl: '',
          type: itemData.type,
          season: itemData.season,
          formality: itemData.formality,
          mainColor: itemData.mainColor,
          additionalColors: itemData.additionalColors,
          brand: itemData.brand,
          reference: itemData.reference,
        },
        { client: trx }
      )

      const key = `${idUser}/items/${item.idItem}.${itemData.image.extname}`
      await itemData.image.moveToDisk(key)

      item.imageUrl = itemData.image.meta.url
      await item.useTransaction(trx).save()

      return item
    })
    return newItem
  }

  async updateItem(item: Item, itemData: Partial<Item>) {
    item.name = itemData.name ?? item.name
    item.description = itemData.description ?? item.description
    item.tags = itemData.tags ?? item.tags
    item.type = itemData.type ?? item.type
    item.season = itemData.season ?? item.season
    item.formality = itemData.formality ?? item.formality
    item.mainColor = itemData.mainColor ?? item.mainColor
    item.additionalColors = itemData.additionalColors ?? item.additionalColors
    item.brand = itemData.brand ?? item.brand
    item.reference = itemData.reference ?? item.reference

    await item.save()

    return item
  }

  async getItemByIdOrFail(idItem: number) {
    const item = await Item.query().where('idItem', idItem).firstOrFail()
    return item
  }

  async deleteItemById(idItem: number) {
    const item = await this.getItemByIdOrFail(idItem)
    await item.delete()
  }
}
