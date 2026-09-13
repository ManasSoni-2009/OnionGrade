import type { LotAssessment, MarketRegion, QualityMetrics } from './types'

export const regions: MarketRegion[] = [
  { id: 'nashik', name: 'Nashik, Maharashtra', market: 'Lasalgaon APMC', rate: 31.5 },
  { id: 'pune', name: 'Pune, Maharashtra', market: 'Pune Market Yard', rate: 29.0 },
  { id: 'indore', name: 'Indore, Madhya Pradesh', market: 'Choithram Mandi', rate: 27.5 },
  { id: 'bengaluru', name: 'Bengaluru, Karnataka', market: 'Yeshwanthpur APMC', rate: 34.0 },
]

export const makeMetrics = (seed: number): QualityMetrics => {
  const gradeA = 68 + (seed % 12)
  const urs = 7 + (seed % 5)
  const damaged = 4 + (seed % 3)
  const rotten = 2 + (seed % 2)
  const sprouted = 1 + (seed % 2)
  const sizes = ['Small', 'Medium', 'Large']
  const avgSize = sizes[seed % 3]
  return { gradeA, gradeB: 100 - gradeA - urs, urs, damaged, rotten, sprouted, undersized: Math.max(2, urs - damaged + 1), avgSize, appearance: 86 + (seed % 9), confidence: 92 + (seed % 6) }
}

let assessmentCounter = 0

export const createAssessment = (weight: number, variety: string, region: MarketRegion, imageCount: number, seed = imageCount * 11): LotAssessment => {
  const metrics = makeMetrics(seed)
  const premium = Math.round(metrics.gradeA * 0.055 * 10) / 10
  const penalty = Math.round(metrics.urs * 0.12 * 10) / 10
  const fairPrice = Math.round((region.rate + premium - penalty) * 10) / 10
  const stamp = new Date()
  const uid = `${++assessmentCounter}-${Math.random().toString(36).substring(2, 6)}`
  return {
    id: `LOT-${stamp.getTime()}-${seed}-${uid}`,
    code: `OG-${stamp.getFullYear()}-${String((seed * 83 + 100) % 99999).padStart(5, '0')}`,
    variety, weight, region, capturedAt: stamp.toISOString(), location: 'Farm assessment · GPS simulated', imageCount,
    status: 'verified', metrics,
    pricing: { marketRate: region.rate, fairPrice, estimatedValue: Math.round(fairPrice * weight), premium, penalty },
  }
}

export const seededReports = (): LotAssessment[] => [
  { ...createAssessment(1250, 'Nashik Red', regions[0], 8, 19), id: 'LOT-SEED-19', code: 'OG-2025-01577' },
  { ...createAssessment(680, 'Agrifound Dark Red', regions[1], 7, 12), id: 'LOT-SEED-12', code: 'OG-2025-00996' },
  { ...createAssessment(940, 'Nashik Red', regions[0], 9, 25), id: 'LOT-SEED-25', code: 'OG-2025-02075' },
]
