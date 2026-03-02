import { tool } from 'ai'
import { z } from 'zod'

const geocodeCitySchema = z.object({
  city: z.string().describe("Nom de la ville à géocoder (ex: 'Paris', 'Lyon', 'New York')"),
})

export const geocodeCityTool = tool({
  description:
    'Convertit un nom de ville en coordonnées GPS (latitude/longitude). Utilise cet outil avant getWeather pour obtenir les coordonnées nécessaires. Retourne plusieurs résultats si le nom est ambigu.',
  inputSchema: geocodeCitySchema,
  execute: async (params) => {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(params.city)}&count=3&language=fr&format=json`

    const response = await fetch(url)
    if (!response.ok) {
      return { results: [], error: 'Erreur lors du géocodage' }
    }

    const data: any = await response.json()

    if (!data.results || data.results.length === 0) {
      return { results: [], error: `Aucune ville trouvée pour "${params.city}"` }
    }

    return {
      results: data.results.map(
        (r: {
          name: string
          latitude: number
          longitude: number
          country: string
          admin1?: string
        }) => ({
          name: r.name,
          latitude: r.latitude,
          longitude: r.longitude,
          country: r.country,
          region: r.admin1 ?? null,
        })
      ),
    }
  },
})
