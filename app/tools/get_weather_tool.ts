import { tool } from 'ai'
import { z } from 'zod'

const getWeatherSchema = z.object({
  latitude: z.number().describe('Latitude du lieu'),
  longitude: z.number().describe('Longitude du lieu'),
  forecastDays: z
    .number()
    .min(1)
    .max(7)
    .optional()
    .default(1)
    .describe("Nombre de jours de prévision (1 à 7, par défaut 1 pour aujourd'hui)"),
})

const weatherCodeToDescription = (code: number): string => {
  const descriptions: Record<number, string> = {
    0: 'Ciel dégagé',
    1: 'Principalement dégagé',
    2: 'Partiellement nuageux',
    3: 'Couvert',
    45: 'Brouillard',
    48: 'Brouillard givrant',
    51: 'Bruine légère',
    53: 'Bruine modérée',
    55: 'Bruine dense',
    61: 'Pluie légère',
    63: 'Pluie modérée',
    65: 'Pluie forte',
    66: 'Pluie verglaçante légère',
    67: 'Pluie verglaçante forte',
    71: 'Neige légère',
    73: 'Neige modérée',
    75: 'Neige forte',
    77: 'Grains de neige',
    80: 'Averses légères',
    81: 'Averses modérées',
    82: 'Averses violentes',
    85: 'Averses de neige légères',
    86: 'Averses de neige fortes',
    95: 'Orage',
    96: 'Orage avec grêle légère',
    99: 'Orage avec grêle forte',
  }
  return descriptions[code] ?? 'Conditions inconnues'
}

export const getWeatherTool = tool({
  description:
    "Récupère les prévisions météo pour des coordonnées GPS données. Retourne la température, les précipitations, le vent et une description des conditions. Utilise d'abord geocodeCity pour obtenir les coordonnées d'une ville.",
  inputSchema: getWeatherSchema,
  execute: async (params) => {
    const { latitude, longitude, forecastDays } = params

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_sum,precipitation_probability_max,windspeed_10m_max,weathercode&current=temperature_2m,apparent_temperature,weathercode,windspeed_10m,relative_humidity_2m&timezone=auto&forecast_days=${forecastDays}`

    const response = await fetch(url)
    if (!response.ok) {
      return { current: null, daily: [], error: 'Erreur lors de la récupération météo' }
    }

    const data: any = await response.json()

    const current = data.current
      ? {
          temperature: data.current.temperature_2m,
          apparentTemperature: data.current.apparent_temperature,
          description: weatherCodeToDescription(data.current.weathercode),
          windSpeed: data.current.windspeed_10m,
          humidity: data.current.relative_humidity_2m,
        }
      : null

    const daily = (data.daily?.time ?? []).map((date: string, i: number) => ({
      date,
      temperatureMax: data.daily.temperature_2m_max[i],
      temperatureMin: data.daily.temperature_2m_min[i],
      apparentTemperatureMax: data.daily.apparent_temperature_max[i],
      apparentTemperatureMin: data.daily.apparent_temperature_min[i],
      precipitationSum: data.daily.precipitation_sum[i],
      precipitationProbability: data.daily.precipitation_probability_max[i],
      windSpeedMax: data.daily.windspeed_10m_max[i],
      description: weatherCodeToDescription(data.daily.weathercode[i]),
    }))

    return { current, daily }
  },
})
