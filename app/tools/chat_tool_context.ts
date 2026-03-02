import EmbeddingService from '#services/embedding_service'
import ItemsRepository from '../repositories/items_repository.js'
import LooksRepository from '../repositories/looks_repository.js'
import PlannedOutfitsRepository from '../repositories/planned_outfits_repository.js'

export interface ChatToolContext {
  userId: number
  itemsRepository: ItemsRepository
  looksRepository: LooksRepository
  plannedOutfitsRepository: PlannedOutfitsRepository
  embeddingService: EmbeddingService
}
