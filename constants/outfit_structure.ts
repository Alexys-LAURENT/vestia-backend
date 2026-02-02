// IF YOU MODIFY THIS FILE, MAKE SURE TO UPDATE THE SAME CONSTANTS IN THE FRONTEND APPLICATION

export const OUTFIT_CATEGORIES = {
  TOPS: ['T-shirts & Tops', 'Sweatshirts & Hoodies', 'Pulls & Mailles', 'Chemises'],
  BOTTOMS: ['Pantalons', 'Jupes', 'Shorts'],
  DRESSES: ['Robes'],
  OUTERWEAR: ['Vestes & Manteaux'],
  SHOES: ['Chaussures'],
  ACCESSORIES: ['Accessoires'],
} as const

export type OutfitCategory = 'tops' | 'bottoms' | 'dresses' | 'outerwear' | 'shoes' | 'accessories'

export const OUTFIT_CONSTRAINTS = {
  MIN_ITEMS: 2,
  MAX_ITEMS: 6,
} as const

/**
 * Maps an item type to its outfit category
 */
export function getItemCategory(type: string): OutfitCategory | null {
  if (OUTFIT_CATEGORIES.TOPS.includes(type as any)) return 'tops'
  if (OUTFIT_CATEGORIES.BOTTOMS.includes(type as any)) return 'bottoms'
  if (OUTFIT_CATEGORIES.DRESSES.includes(type as any)) return 'dresses'
  if (OUTFIT_CATEGORIES.OUTERWEAR.includes(type as any)) return 'outerwear'
  if (OUTFIT_CATEGORIES.SHOES.includes(type as any)) return 'shoes'
  if (OUTFIT_CATEGORIES.ACCESSORIES.includes(type as any)) return 'accessories'

  return null
}

/**
 * Validates if an outfit has a valid structure:
 * - Either (top + bottom) OR (dress) as base
 * - Dress cannot be combined with top or bottom
 */
export function isValidOutfitStructure(categories: Record<OutfitCategory, boolean>): boolean {
  const hasTopAndBottom = categories.tops && categories.bottoms
  const hasDress = categories.dresses

  // Must have either (top + bottom) or dress
  if (!hasTopAndBottom && !hasDress) {
    return false
  }

  // Dress cannot be combined with top or bottom
  if (hasDress && (categories.tops || categories.bottoms)) {
    return false
  }

  return true
}
