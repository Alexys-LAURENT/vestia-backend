import { tool } from 'ai'
import { z } from 'zod'

const displayItemsSchema = z.object({
  items: z
    .array(
      z.object({
        idItem: z.number().describe("L'identifiant unique du vêtement (champ idItem de l'item)"),
        name: z.string().describe("Le nom du vêtement (champ name de l'item)"),
        imageUrl: z
          .string()
          .describe(
            "L'URL de l'image du vêtement (champ imageUrl de l'item, ex: /uploads/items/xxx.jpg)"
          ),
        type: z.string().optional().describe("Le type de vêtement (champ type de l'item)"),
        brand: z
          .string()
          .nullable()
          .optional()
          .describe("La marque du vêtement (champ brand de l'item)"),
      })
    )
    .min(1)
    .describe(
      "Liste ordonnée des vêtements à afficher. Utilise EXACTEMENT les champs idItem, name, imageUrl, type et brand tels qu'ils apparaissent dans les réponses des outils searchItems, semanticSearch ou generateOutfit. L'ordre du tableau détermine l'ordre d'affichage de gauche à droite."
    ),
})

export const displayItemsTool = tool({
  description:
    "Affiche un ou plusieurs vêtements visuellement dans le chat sous forme de carrousel d'images. Utilise cet outil pour montrer des vêtements à l'utilisateur après les avoir récupérés via searchItems, semanticSearch ou generateOutfit. L'ordre des items dans le tableau sera l'ordre d'affichage de gauche à droite.",
  inputSchema: displayItemsSchema,
  execute: async (params) => {
    return { items: params.items }
  },
})
