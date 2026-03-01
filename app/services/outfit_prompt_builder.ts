import Item from '#models/item'
import { OUTFIT_CATEGORIES, OUTFIT_CONSTRAINTS } from '../../constants/outfit_structure.js'

export interface PromptData {
  systemPrompt: string
  userPrompt: string
}

export default class OutfitPromptBuilder {
  /**
   * Builds the wardrobe description section of the prompt
   */
  private buildWardrobeDescription(itemsByType: Record<string, Item[]>): string {
    let description = ''

    for (const [type, items] of Object.entries(itemsByType)) {
      description += `\n## ${type.toUpperCase()} (${items.length} options)\n`
      for (const item of items) {
        description += `- [ID ${item.idItem}]: ${item.name} | Couleur: ${item.mainColor} | Saison: ${item.season} | Formalité: ${item.formality}\n`
      }
    }

    return description
  }

  /**
   * Builds the forced items section of the prompt
   */
  private buildForcedItemsSection(forcedItems: Item[]): string {
    if (forcedItems.length === 0) return ''

    return `\n\n## ⭐ VÊTEMENTS IMPOSÉS (OBLIGATOIRES) ⭐
L'utilisateur a demandé d'inclure ces vêtements dans la tenue:
${forcedItems.map((item) => `- [ID ${item.idItem}]: ${item.name} (${item.type}) | Couleur: ${item.mainColor}`).join('\n')}

⚠️ CES VÊTEMENTS DOIVENT ABSOLUMENT ÊTRE DANS LA TENUE FINALE.
Tu dois construire le reste de la tenue autour de ces pièces imposées.`
  }

  /**
   * Builds the disliked items section of the prompt
   */
  private buildNotLikedItemsSection(notLikedItems: Item[]): string {
    if (notLikedItems.length === 0) return ''

    return `\n\n## ❌ VÊTEMENTS NON AIMÉS ❌
L'utilisateur n'aime pas ces vêtements et préfère ne pas les inclure dans la tenue:
${notLikedItems.map((item) => `- [ID ${item.idItem}]: ${item.name} (${item.type}) | Couleur: ${item.mainColor}`).join('\n')}

⚠️ ÉVITE D'UTILISER CES VÊTEMENTS DANS LA TENUE FINALE.`
  }

  /**
   * Builds the complete system prompt for AI generation
   */
  buildSystemPrompt(
    itemsByType: Record<string, Item[]>,
    forcedItems: Item[],
    notLikedItems: Item[]
  ): string {
    const wardrobeDescription = this.buildWardrobeDescription(itemsByType)
    const forcedItemsSection = this.buildForcedItemsSection(forcedItems)
    const notLikedItemsSection = this.buildNotLikedItemsSection(notLikedItems)

    return `Tu es VestIA, un assistant IA spécialisé en mode.

## STRUCTURE OBLIGATOIRE D'UNE TENUE:

**Option A - Tenue classique:**
- EXACTEMENT 1 haut parmi: ${OUTFIT_CATEGORIES.TOPS.join(', ')}
- EXACTEMENT 1 bas parmi: ${OUTFIT_CATEGORIES.BOTTOMS.join(', ')}
- OPTIONNEL: 1 pièce de ${OUTFIT_CATEGORIES.OUTERWEAR.join(', ')}
- OPTIONNEL: 1 paire de ${OUTFIT_CATEGORIES.SHOES.join(', ')}
- OPTIONNEL: Des ${OUTFIT_CATEGORIES.ACCESSORIES.join(', ')}

**Option B - Robe:**
- EXACTEMENT 1 Robe (qui remplace haut + bas)
- OPTIONNEL: 1 pièce de ${OUTFIT_CATEGORIES.OUTERWEAR.join(', ')}
- OPTIONNEL: 1 paire de ${OUTFIT_CATEGORIES.SHOES.join(', ')}
- OPTIONNEL: Des ${OUTFIT_CATEGORIES.ACCESSORIES.join(', ')}

## ⚠️ RÈGLES ABSOLUES:
1. **INTERDIT**: 2 hauts, 2 pantalons, 2 vestes, 2 chaussures
2. **OBLIGATION**: Chaque catégorie ne peut apparaître QU'UNE SEULE FOIS
   - Si tu choisis un T-shirt, tu ne peux PAS ajouter une Chemise
   - Si tu choisis un Pantalon, tu ne peux PAS ajouter un Short
3. **IDS VALIDES UNIQUEMENT**: Tu DOIS utiliser les IDs entre crochets [ID:X]
4. **Cohérence**: Les couleurs et styles doivent s'harmoniser
5. **TOTAL**: Entre ${OUTFIT_CONSTRAINTS.MIN_ITEMS} et ${OUTFIT_CONSTRAINTS.MAX_ITEMS} vêtements maximum
${forcedItems.length > 0 ? '6. **ITEMS IMPOSÉS**: Tu DOIS inclure tous les items marqués ⭐ ci-dessous' : ''}

## Wardrobe disponible:
${wardrobeDescription}
${forcedItemsSection}
${notLikedItemsSection}

## FORMAT DE RÉPONSE:
Réponds UNIQUEMENT en JSON valide. Pas de texte avant ou après.
Structure: {"items": [{"idItem": number, "reason": "string"}], "generalReasoning": "string"}`
  }

  /**
   * Builds the user prompt based on constraints
   */
  buildUserPrompt(forcedItemIds?: number[], context?: string): string {
    let base = ''
    if (context) {
      base = `Contexte demandé par l'utilisateur : "${context}". `
    }

    if (forcedItemIds && forcedItemIds.length > 0) {
      return `${base}Crée une tenue complète en incluant OBLIGATOIREMENT les vêtements imposés (IDs: ${forcedItemIds.join(', ')}). Construis le reste de la tenue pour qu'elle soit cohérente avec ces pièces.`
    }

    return `${base}Génère une tenue complète et cohérente avec un seul vêtement par catégorie.`
  }

  /**
   * Builds complete prompt data for AI generation
   */
  buildPrompt(
    itemsByType: Record<string, Item[]>,
    forcedItems: Item[],
    notLikedItems: Item[],
    forcedItemIds?: number[],
    context?: string
  ): PromptData {
    return {
      systemPrompt: this.buildSystemPrompt(itemsByType, forcedItems, notLikedItems),
      userPrompt: this.buildUserPrompt(forcedItemIds, context),
    }
  }
}
