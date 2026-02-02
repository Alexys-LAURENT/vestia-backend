import Item from '#models/item'
import logger from '@adonisjs/core/services/logger'
import { google } from '@ai-sdk/google'
import { generateObject } from 'ai'
import {
  getItemCategory,
  OUTFIT_CATEGORIES,
  type OutfitCategory,
} from '../../constants/outfit_structure.js'
import { lookGenerationSchema } from '../controllers/looks_controller/validators.js'
import OutfitPromptBuilder from './outfit_prompt_builder.js'
import OutfitValidationService from './outfit_validation_service.js'

export interface GeneratedOutfit {
  items: Array<{ idItem: number; reason: string }>
  selectedItems: Item[]
  generalReasoning: string
  generationMethod: 'ai' | 'fallback'
}

export interface GenerationOptions {
  forcedItemIds?: number[]
  notLikedItemIds?: number[]
  maxAttempts?: number
  temperature?: number
}

export default class OutfitGeneratorService {
  constructor(
    private validationService: OutfitValidationService,
    private promptBuilder: OutfitPromptBuilder
  ) {}

  /**
   * Generates an outfit using AI with fallback to manual generation
   */
  async generate(allItems: Item[], options: GenerationOptions = {}): Promise<GeneratedOutfit> {
    const {
      forcedItemIds = [],
      notLikedItemIds = [],
      maxAttempts = 3,
      temperature = 0.7,
    } = options

    // Prepare data
    const { forcedItems, notLikedItems, itemsByType } = this.prepareItems(
      allItems,
      forcedItemIds,
      notLikedItemIds
    )

    // Try AI generation with retries
    const aiOutfit = await this.tryAiGeneration(
      allItems,
      itemsByType,
      forcedItems,
      notLikedItems,
      forcedItemIds,
      maxAttempts,
      temperature
    )

    if (aiOutfit) {
      return { ...aiOutfit, generationMethod: 'ai' }
    }

    // Fallback to manual generation
    logger.warn('IA a échoué après plusieurs tentatives, génération manuelle...')
    return this.generateFallback(itemsByType, forcedItems)
  }

  /**
   * Prepares and validates items for generation
   */
  private prepareItems(
    allItems: Item[],
    forcedItemIds: number[],
    notLikedItemIds: number[]
  ): {
    forcedItems: Item[]
    notLikedItems: Item[]
    itemsByType: Record<string, Item[]>
  } {
    // Find forced items
    const forcedItems: Item[] = []
    for (const id of forcedItemIds) {
      const item = allItems.find((i) => i.idItem === id)
      if (!item) {
        throw new Error(`L'item avec l'ID ${id} n'existe pas dans votre garde-robe.`)
      }
      forcedItems.push(item)
    }

    // Find not liked items
    const notLikedItems: Item[] = []
    for (const id of notLikedItemIds) {
      const item = allItems.find((i) => i.idItem === id)
      if (item) {
        notLikedItems.push(item)
      }
    }

    // Group items by type
    const itemsByType: Record<string, Item[]> = {}
    for (const item of allItems) {
      if (!itemsByType[item.type]) {
        itemsByType[item.type] = []
      }
      itemsByType[item.type].push(item)
    }

    return { forcedItems, notLikedItems, itemsByType }
  }

  /**
   * Attempts to generate outfit using AI with retries
   */
  private async tryAiGeneration(
    allItems: Item[],
    itemsByType: Record<string, Item[]>,
    forcedItems: Item[],
    notLikedItems: Item[],
    forcedItemIds: number[],
    maxAttempts: number,
    temperature: number
  ): Promise<Omit<GeneratedOutfit, 'generationMethod'> | null> {
    const { systemPrompt, userPrompt } = this.promptBuilder.buildPrompt(
      itemsByType,
      forcedItems,
      notLikedItems,
      forcedItemIds
    )

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await generateObject({
          model: google('gemini-2.5-flash'),
          schema: lookGenerationSchema,
          system: systemPrompt,
          prompt: userPrompt,
          temperature,
        })

        const selectedItemIds = result.object.items.map((item) => item.idItem)
        const validation = this.validationService.validateOutfit(
          selectedItemIds,
          allItems,
          forcedItemIds
        )

        if (validation.isValid) {
          return {
            items: result.object.items,
            selectedItems: validation.selectedItems,
            generalReasoning: result.object.generalReasoning,
          }
        }

        logger.warn(
          `Tentative ${attempt}/${maxAttempts}: Validation échouée - ${validation.errors.join(', ')}`
        )
      } catch (error) {
        logger.error(`Tentative ${attempt}/${maxAttempts}: Erreur AI - ${error.message}`)
      }
    }

    return null
  }

  /**
   * Generates outfit manually when AI fails
   */
  private generateFallback(
    itemsByType: Record<string, Item[]>,
    forcedItems: Item[] = []
  ): GeneratedOutfit {
    const selectedItems: Item[] = [...forcedItems]
    const items: Array<{ idItem: number; reason: string }> = forcedItems.map((item) => ({
      idItem: item.idItem,
      reason: "Vêtement imposé par l'utilisateur",
    }))

    const categoriesTaken = new Set<OutfitCategory>()
    for (const item of forcedItems) {
      const category = getItemCategory(item.type)
      if (category) categoriesTaken.add(category)
    }

    // If there's a dress, just add optional items
    if (categoriesTaken.has('dresses')) {
      this.addOptionalItems(
        itemsByType,
        selectedItems,
        items,
        ['Chaussures', 'Vestes & Manteaux', 'Accessoires'],
        categoriesTaken
      )
      return {
        items,
        selectedItems,
        generalReasoning: 'Tenue élégante basée sur la robe imposée',
        generationMethod: 'fallback',
      }
    }

    // Add top if missing
    if (!categoriesTaken.has('tops')) {
      this.addFirstAvailable(
        itemsByType,
        selectedItems,
        items,
        OUTFIT_CATEGORIES.TOPS,
        'Haut sélectionné pour compléter la tenue',
        categoriesTaken
      )
    }

    // Add bottom if missing
    if (!categoriesTaken.has('bottoms')) {
      this.addFirstAvailable(
        itemsByType,
        selectedItems,
        items,
        OUTFIT_CATEGORIES.BOTTOMS,
        'Bas assorti à la tenue',
        categoriesTaken
      )
    }

    // Add optional items
    this.addOptionalItems(
      itemsByType,
      selectedItems,
      items,
      ['Chaussures', 'Vestes & Manteaux', 'Accessoires'],
      categoriesTaken
    )

    return {
      items,
      selectedItems,
      generalReasoning:
        forcedItems.length > 0
          ? 'Tenue complétée autour des vêtements imposés'
          : 'Tenue décontractée et polyvalente',
      generationMethod: 'fallback',
    }
  }

  /**
   * Adds the first available item from a list of types
   */
  private addFirstAvailable(
    itemsByType: Record<string, Item[]>,
    selectedItems: Item[],
    items: Array<{ idItem: number; reason: string }>,
    types: readonly string[],
    reason: string,
    categoriesTaken: Set<OutfitCategory>
  ): void {
    for (const type of types) {
      if (itemsByType[type] && itemsByType[type].length > 0) {
        const item = itemsByType[type][0]
        selectedItems.push(item)
        items.push({ idItem: item.idItem, reason })
        const category = getItemCategory(type)
        if (category) categoriesTaken.add(category)
        break
      }
    }
  }

  /**
   * Adds optional items to complete the outfit
   */
  private addOptionalItems(
    itemsByType: Record<string, Item[]>,
    selectedItems: Item[],
    items: Array<{ idItem: number; reason: string }>,
    optionalTypes: string[],
    categoriesTaken: Set<OutfitCategory>
  ): void {
    for (const type of optionalTypes) {
      if (selectedItems.length >= 6) break

      const category = getItemCategory(type)
      if (category && categoriesTaken.has(category)) continue

      if (itemsByType[type] && itemsByType[type].length > 0) {
        const item = itemsByType[type][0]
        selectedItems.push(item)
        items.push({
          idItem: item.idItem,
          reason: `${type} pour compléter la tenue`,
        })
        if (category) categoriesTaken.add(category)
      }
    }
  }
}
