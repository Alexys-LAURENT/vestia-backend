import Look from '#models/look'

export default class LooksRepository {
  async getAllItemsForOneUserWithPaginated(idUser: number, limit?: number, page?: number) {
    const query = Look.query().where('id_user', idUser).preload('items')

    const items = await query.paginate(page ?? 1, limit ?? 20)
    return items
  }
}
