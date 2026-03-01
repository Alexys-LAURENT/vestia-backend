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

  async getWardrobeStats(idUser: number) {
    const items = await Item.query()
      .where('id_user', idUser)
      .select('id_item', 'name', 'type', 'season', 'formality', 'main_color', 'additional_colors')

    const byType: Record<string, number> = {}
    const bySeason: Record<string, number> = {}
    const byFormality: Record<string, number> = {}
    const colorsMap = new Map<
      string,
      { count: number; items: Array<{ idItem: number; name: string }> }
    >()

    for (const item of items) {
      byType[item.type] = (byType[item.type] || 0) + 1
      bySeason[item.season] = (bySeason[item.season] || 0) + 1
      byFormality[item.formality] = (byFormality[item.formality] || 0) + 1

      const allColors = [item.mainColor, ...(item.additionalColors || [])].filter(Boolean)
      for (const color of allColors) {
        if (!colorsMap.has(color)) {
          colorsMap.set(color, { count: 0, items: [] })
        }
        const entry = colorsMap.get(color)!
        entry.count++
        entry.items.push({ idItem: item.idItem, name: item.name })
      }
    }

    return {
      totalItems: items.length,
      byType,
      bySeason,
      byFormality,
      colors: Array.from(colorsMap.entries())
        .map(([color, data]) => ({ color, ...data }))
        .sort((a, b) => b.count - a.count),
      availableTypes: Object.keys(byType),
      availableSeasons: Object.keys(bySeason),
      availableFormalities: Object.keys(byFormality),
    }
  }

  async searchWithFilters(
    idUser: number,
    filters: {
      type?: string
      season?: string
      formality?: string
      color?: string
      limit?: number
    }
  ) {
    const query = Item.query().where('id_user', idUser)

    if (filters.type) {
      query.andWhere('type', filters.type)
    }
    if (filters.season) {
      query.andWhere('season', filters.season)
    }
    if (filters.formality) {
      query.andWhere('formality', filters.formality)
    }
    if (filters.color) {
      query.andWhere((builder) => {
        builder
          .whereILike('main_color', `%${filters.color}%`)
          .orWhereRaw('additional_colors::text ILIKE ?', [`%${filters.color}%`])
      })
    }

    return query.limit(filters.limit ?? 20)
  }

  async searchBySemantic(idUser: number, queryEmbedding: number[], limit: number = 10) {
    const embeddingStr = `[${queryEmbedding.join(',')}]`
    const result = await db.rawQuery(
      `SELECT id_item, name, description, tags, image_url, type, season, formality,
              main_color, additional_colors, brand, reference, created_at, updated_at,
              1 - (embedding <=> ?::vector) AS score
       FROM items
       WHERE id_user = ? AND embedding IS NOT NULL
       ORDER BY embedding <=> ?::vector
       LIMIT ?`,
      [embeddingStr, idUser, embeddingStr, limit]
    )
    return result.rows.map((row: any) => ({
      idItem: row.id_item,
      name: row.name,
      description: row.description,
      tags: row.tags,
      imageUrl: row.image_url,
      type: row.type,
      season: row.season,
      formality: row.formality,
      mainColor: row.main_color,
      additionalColors: row.additional_colors,
      brand: row.brand,
      reference: row.reference,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      score: row.score,
    }))
  }

  async updateEmbedding(itemId: number, embedding: number[]) {
    const embeddingStr = `[${embedding.join(',')}]`
    await db.rawQuery('UPDATE items SET embedding = ?::vector WHERE id_item = ?', [
      embeddingStr,
      itemId,
    ])
  }
}
