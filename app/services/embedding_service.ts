import Item from '#models/item'
import logger from '@adonisjs/core/services/logger'
import { embed } from 'ai'
import { ollama } from 'ollama-ai-provider-v2'

export default class EmbeddingService {
  private readonly embeddingModel = 'qwen3-embedding:4b'

  async generateEmbedding(text: string): Promise<number[]> {
    const { embedding } = await embed({
      model: ollama.embedding(this.embeddingModel),
      value: text,
    })

    return embedding
  }

  buildItemText(item: Item): string {
    const parts = [item.name, item.description, item.tags.join(', '), `Couleur: ${item.mainColor}`]
    if (item.additionalColors?.length) {
      parts.push(item.additionalColors.join(', '))
    }
    return parts.filter(Boolean).join('. ')
  }

  async generateItemEmbedding(item: Item): Promise<number[]> {
    logger.info(`Génération de l'embedding pour l'item ${item.idItem}`)
    return this.generateEmbedding(this.buildItemText(item))
  }
}
