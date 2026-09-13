export type ReportStatus = 'verified' | 'draft'

export interface QualityMetrics {
  gradeA: number
  gradeB: number
  urs: number
  damaged: number
  rotten: number
  sprouted: number
  undersized: number
  avgSize: string
  appearance: number
  confidence: number
}

export interface PricingEstimate {
  marketRate: number
  fairPrice: number
  estimatedValue: number
  premium: number
  penalty: number
}

export interface MarketRegion { id: string; name: string; market: string; rate: number }
export interface CaptureImage { id: string; name: string; preview?: string; file?: File }

export interface LotAssessment {
  id: string
  code: string
  variety: string
  weight: number
  region: MarketRegion
  capturedAt: string
  location: string
  imageCount: number
  status: ReportStatus
  metrics: QualityMetrics
  pricing: PricingEstimate
  isGuest?: boolean
  images?: string[]
}
