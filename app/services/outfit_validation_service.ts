import Item from '#models/item'
import {
  getItemCategory,
  isValidOutfitStructure,
  type OutfitCategory,
} from '../../constants/outfit_structure.js'

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  selectedItems: Item[]
  categoriesUsed: Record<OutfitCategory, boolean>
}

export default class OutfitValidationService {
  /**
   * Validates a generated outfit against business rules:
   * - All item IDs must exist in the user's wardrobe
   * - No duplicate categories (can't have 2 tops, 2 bottoms, etc.)
   * - Must have valid structure: (top + bottom) OR (dress)
   * - All forced items must be included
   */
  validateOutfit(
    selectedItemIds: number[],
    allItems: Item[],
    forcedItemIds?: number[]
  ): ValidationResult {
    const errors: string[] = []
    const selectedItems: Item[] = []
    const categoriesUsed: Record<OutfitCategory, boolean> = {
      tops: false,
      bottoms: false,
      dresses: false,
      outerwear: false,
      shoes: false,
      accessories: false,
    }

    // Check if all forced items are present
    if (forcedItemIds && forcedItemIds.length > 0) {
      const missingForcedIds = forcedItemIds.filter((id) => !selectedItemIds.includes(id))
      if (missingForcedIds.length > 0) {
        errors.push(`Items forcés manquants: ${missingForcedIds.join(', ')}`)
        return { isValid: false, errors, selectedItems, categoriesUsed }
      }
    }

    // Validate each item
    for (const id of selectedItemIds) {
      const item = allItems.find((i) => i.idItem === id)

      if (!item) {
        errors.push(`ID ${id} invalide`)
        return { isValid: false, errors, selectedItems, categoriesUsed }
      }

      const category = getItemCategory(item.type)

      // Check for duplicate categories
      if (category && categoriesUsed[category]) {
        errors.push(`Catégorie "${category}" déjà utilisée (${item.type})`)
        return { isValid: false, errors, selectedItems, categoriesUsed }
      }

      if (category) {
        categoriesUsed[category] = true
      }
      selectedItems.push(item)
    }

    // Validate outfit structure
    if (!isValidOutfitStructure(categoriesUsed)) {
      if (!categoriesUsed.tops && !categoriesUsed.bottoms && !categoriesUsed.dresses) {
        errors.push('Tenue incomplète (besoin de haut+bas OU robe)')
      } else if (categoriesUsed.dresses && (categoriesUsed.tops || categoriesUsed.bottoms)) {
        errors.push('Robe combinée avec haut/bas (invalide)')
      }
      return { isValid: false, errors, selectedItems, categoriesUsed }
    }

    return {
      isValid: true,
      errors: [],
      selectedItems,
      categoriesUsed,
    }
  }

  /**
   * Groups items by category for easier organization
   */
  groupItemsByCategory(items: Item[]): Record<OutfitCategory, Item[]> {
    const grouped: Record<OutfitCategory, Item[]> = {
      tops: [],
      bottoms: [],
      dresses: [],
      outerwear: [],
      shoes: [],
      accessories: [],
    }

    for (const item of items) {
      const category = getItemCategory(item.type)
      if (category) {
        grouped[category].push(item)
      }
    }

    return grouped
  }
}
