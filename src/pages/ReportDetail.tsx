import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, Navigate, Link } from 'react-router-dom'
import {
  SealCheck,
  ShareNetwork,
  DownloadSimple,
  MapPin,
  Sparkle,
  QrCode,
  ShieldCheck,
  X,
  ArrowRight,
  TrendUp,
  Warehouse,
  CookingPot,
  WarningCircle,
  Lightbulb,
  Camera,
} from '@phosphor-icons/react'
import type { LotAssessment } from '../types'
import { QRCodeSVG } from 'qrcode.react'
import { createAssessment, regions } from '../data'
import { useReveal, money, formatDate } from '../hooks/useAnimations'

const storageKey = 'oniongrade-reports'

function loadReports() {
  try {
    const saved = localStorage.getItem(storageKey)
    return saved ? (JSON.parse(saved) as LotAssessment[]) : null
  } catch {
    return null
  }
}

import { useStore } from "../store"

export function ReportDetail() {
  const reports = useStore(state => state.reports)
  const notify = useStore(state => state.notify)
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const draft = useMemo(() => {
    const saved = sessionStorage.getItem('oniongrade-draft')
    return saved ? (JSON.parse(saved) as LotAssessment) : null
  }, [])
  const found = id === 'draft' ? draft : reports.find((r) => r.id === id)
  const [share, setShare] = useState(false)
  const ref = useReveal([id, found])

  useEffect(() => {
    if (id === 'draft' && draft) {
      const final = createAssessment(
        draft.weight,
        draft.variety,
        draft.region || regions[0],
        draft.imageCount,
        draft.imageCount * 17
      )
      final.id = draft.id
      final.code = draft.code
      sessionStorage.removeItem('oniongrade-draft')
      navigate(`/reports/${final.id}`, { replace: true })
      try {
        useStore.getState().addReport(final)
      } catch {
        /* local storage is optional */
      }
    }
  }, [id, draft, navigate])

  if (!found) {
    return <Navigate to="/reports" replace />
  }

  const r = found

  return (
    <div className="page" ref={ref}>
      <div className="page-heading" data-reveal-tier="1">
        <div>
          <h1>Quality report</h1>
          <p>{r.code} · {formatDate(r.capturedAt)}</p>
        </div>
        <div className="report-actions" data-reveal-tier="3">
          <button
            type="button"
            className="button button-secondary"
            onClick={() => setShare(true)}
          >
            <ShareNetwork size={17} /> Share
          </button>
          <button
            type="button"
            className="button button-primary"
            onClick={() => window.print()}
          >
            <DownloadSimple size={17} /> Export PDF
          </button>
        </div>
      </div>

      <section className="report-hero" data-reveal-tier="2">
        <div className="report-hero-copy">
          {r.isGuest ? (
            <span className="verified" data-reveal-tier="4" style={{ background: '#fce4e4', color: '#8a2b2b', boxShadow: '0 0 0 1px rgba(201, 69, 50, 0.1)' }}>
              <WarningCircle size={16} weight="fill" /> AI assessment complete (Unsaved)
            </span>
          ) : (
            <span className="verified" data-reveal-tier="4">
              <SealCheck size={16} weight="fill" /> AI assessment complete
            </span>
          )}
          <h2 data-reveal-tier="1">
            Your lot is <em>{r.metrics.gradeA}% Grade A.</em>
          </h2>
          <p data-reveal-tier="3">
            {r.variety} · {r.weight.toLocaleString('en-IN')} kg · {r.imageCount} images · {r.region.market}
          </p>
        </div>
        <div className="overall-score">
          <div>
            <b>{r.metrics.appearance}</b>
            <span>Quality score</span>
          </div>
          <small>out of 100</small>
        </div>
      </section>

      <div className="report-grid">
        <section className="quality-breakdown" data-reveal-tier="2">
          <CardTitle eyebrow="Quality distribution" title="What we found" />
          <div className="donut-wrap">
            <QualityDonut metrics={r.metrics} />
            <div className="donut-legend">
              <Legend tone="lime" label="Grade A" value={r.metrics.gradeA} />
              <Legend tone="violet" label="Grade B" value={r.metrics.gradeB} />
              <Legend tone="coral" label="URS" value={r.metrics.urs} />
            </div>
          </div>
          <div className="defect-grid">
            <Defect icon="◌" label="Damaged" value={r.metrics.damaged} />
            <Defect icon="×" label="Rotten" value={r.metrics.rotten} />
            <Defect icon="↗" label="Sprouted" value={r.metrics.sprouted} />
            <Defect icon="↙" label="Undersized" value={r.metrics.undersized} />
          </div>
        </section>

        <section className="price-card" data-reveal-tier="2">
          <CardTitle eyebrow="Fair value estimate" title={`${money(r.pricing.fairPrice)} / kg`} />
          <p className="card-intro">Based on {r.region.market} and the quality of this lot.</p>
          <div className="price-lines">
            <span>
              <i>Market reference</i>
              <b>{money(r.pricing.marketRate)}</b>
            </span>
            <span>
              <i>Grade A premium</i>
              <b className="positive">+{money(r.pricing.premium)}</b>
            </span>
            <span>
              <i>URS adjustment</i>
              <b className="negative">−{money(r.pricing.penalty)}</b>
            </span>
          </div>
          <div className="total-value">
            <span>Expected lot value</span>
            <b>{money(r.pricing.estimatedValue)}</b>
          </div>
          <p className="value-note">
            <Sparkle size={15} weight="fill" /> A transparent estimate, not a dealer quote.
          </p>
        </section>

        <section className="inspection-card" data-reveal-tier="2">
          <CardTitle eyebrow="Inspection details" title="Lot markers" />
          <div className="inspection-pairs">
            <span>
              <i>Average bulb size</i>
              <b>{r.metrics.avgSize} mm</b>
            </span>
            <span>
              <i>Visual appearance</i>
              <b>{r.metrics.appearance}/100</b>
            </span>
            <span>
              <i>AI confidence</i>
              <b>{r.metrics.confidence}%</b>
            </span>
            <span>
              <i>Report status</i>
              {r.isGuest ? (
                <b className="negative">Unsaved</b>
              ) : (
                <b className="positive">Verified</b>
              )}
            </span>
          </div>
          <div className="location-line">
            <MapPin size={16} weight="fill" />
            <span>{r.location}</span>
          </div>
        </section>

        <section className="narrative-card" data-reveal-tier="2">
          <div>
            <div className="card-head">
              <CardTitle eyebrow="AI analysis" title="AI lot summary" />
              <span className="narrative-badge">
                <Sparkle size={14} weight="fill" /> Verified batch
              </span>
            </div>
            <p className="narrative-desc">
              This batch is predominantly Grade A with a healthy average bulb size of {r.metrics.avgSize} mm. Keep the lot dry and separated from the {r.metrics.rotten}% rotten portion before procurement to protect its value.
            </p>
            <div className="narrative-pairs">
              <span>
                <i>Batch grade</i>
                <b className="positive">{r.metrics.gradeA >= 70 ? 'Prime Grade A' : 'Commercial'}</b>
              </span>
              <span>
                <i>Culling priority</i>
                <b>{r.metrics.rotten > 3 ? `Immediate (${r.metrics.rotten}%)` : 'Normal'}</b>
              </span>
            </div>
          </div>
          <div className="narrative-footer">
            <Sparkle size={15} weight="fill" />
            <span>Automated visual appraisal & defect cross-check</span>
          </div>
        </section>

        <ScannedImagesSection report={r} />
      </div>

      <AiAdvisorySection report={r} />

      {share && <ShareModal report={r} close={() => setShare(false)} notify={notify} />}
    </div>
  )
}

function CardTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="card-title">
      <span className="eyebrow">{eyebrow}</span>
      <h3>{title}</h3>
    </div>
  )
}

function Legend({ tone, label, value }: { tone: string; label: string; value: number }) {
  return (
    <span>
      <i className={tone} />
      {label}
      <b>{value}%</b>
    </span>
  )
}

function Defect({ icon, label, value }: { icon: string; label: string; value: number }) {
  return (
    <div>
      <i>{icon}</i>
      <span>{label}</span>
      <b>{value}%</b>
    </div>
  )
}

function QualityDonut({ metrics }: { metrics: LotAssessment['metrics'] }) {
  const a = metrics.gradeA * 3.6
  const b = metrics.gradeB * 3.6
  const c = metrics.urs * 3.6
  return (
    <div
      className="donut"
      style={{
        background: `conic-gradient(#d9f95a 0deg ${a}deg, #b7a5f9 ${a}deg ${a + b}deg, #ff927a ${a + b}deg ${a + b + c}deg)`,
      }}
    >
      <div>
        <b>{metrics.gradeA}%</b>
        <span>Grade A</span>
      </div>
    </div>
  )
}

interface ShareModalProps {
  report: LotAssessment
  close: () => void
  notify: (m: string, k?: 'success' | 'plain') => void
}

function ShareModal({ report, close, notify }: ShareModalProps) {
  const url = `${window.location.origin}/dealer/${report.code}`

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="share-modal">
        <button
          type="button"
          className="modal-close"
          onClick={close}
          aria-label="Close modal"
        >
          <X size={19} />
        </button>
        <span className="share-icon">
          <QrCode size={30} />
        </span>
        <h2>Share verified report</h2>
        <p>Let a dealer scan this code or open the share link to check lot quality.</p>
        <div className="qr-wrapper" style={{ margin: '0 auto 18px', display: 'flex', justifyContent: 'center', background: '#fbfbfb', padding: '12px', borderRadius: '12px', width: 'fit-content' }}>
          <QRCodeSVG value={url} size={140} level="Q" />
        </div>
        <div className="share-url">
          <span>{url}</span>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(url)
              notify('Report link copied')
            }}
          >
            Copy
          </button>
        </div>
        <Link to={`/dealer/${report.code}`} className="button button-primary button-full">
          <ShieldCheck size={18} weight="fill" /> Open dealer view <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  )
}

function ScannedImagesSection({ report }: { report: LotAssessment }) {
  return (
    <section className="scanned-images-card" data-reveal-tier="2">
      <CardTitle eyebrow="Visual evidence" title="Captured lot samples" />
      <div className="scanned-images-grid">
        {Array.from({ length: report.imageCount }).map((_, i) => (
          <div key={i} className="scanned-image-item">
            <div className="scanned-image-placeholder">
              <Camera size={28} weight="duotone" />
            </div>
            <span>Sample {String(i + 1).padStart(2, '0')}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

function AiAdvisorySection({ report }: { report: LotAssessment }) {
  const { gradeA, gradeB, urs, rotten, sprouted, damaged, undersized } = report.metrics
  const fairPrice = report.pricing.fairPrice
  const marketRate = report.pricing.marketRate

  // Sell Strategy (Personalized to quality & prices)
  const sell = useMemo(() => {
    if (gradeA >= 75) {
      return {
        badge: 'Immediate Auction / Direct Retail',
        badgeClass: 'sell',
        icon: TrendUp,
        title: 'Prime Mandi or Retail Dispatch',
        action: 'Capture top-tier price window',
        desc: `With ${gradeA}% Grade A bulb uniformity, this lot qualifies for top-of-market realization (${money(fairPrice)}/kg). Sell immediately via competitive open auction at the APMC Mandi or supply directly to supermarket aggregators to prevent holding shrinkage.`,
        highlights: [
          { label: 'Target Rate', value: `${money(fairPrice)} / kg` },
          { label: 'Buyer Target', value: 'APMC Tier-1 / Retail Aggregators' },
          { label: 'Holding Risk', value: 'Low (Sell within 7 days)' },
        ],
      }
    }
    if (gradeB >= 20 || gradeA >= 50) {
      return {
        badge: 'Sort & Staggered Sale',
        badgeClass: 'sell',
        icon: TrendUp,
        title: 'Grade-Sorted Staggered Sale',
        action: 'Segregate produce prior to mandi arrival',
        desc: `Batch contains ${gradeA}% Grade A alongside ${gradeB}% Grade B. Avoid dumping as an unsorted mixed heap, as mandi buyers bid against the lowest grade. Pre-sorting captures a +${money(report.pricing.premium)}/kg premium on top bulbs while selling Grade B to wholesale traders.`,
        highlights: [
          { label: 'Sorting Premium', value: `+${money(report.pricing.premium)} / kg` },
          { label: 'Value Retention', value: '+14% to +18% gain' },
          { label: 'Recommended Channel', value: 'Wholesale APMC Mandi' },
        ],
      }
    }
    return {
      badge: 'Rapid Clearance',
      badgeClass: 'sell',
      icon: TrendUp,
      title: 'Fast-Track Bulk Clearance',
      action: 'Liquidate within 48-72 hours',
      desc: `Higher URS proportion (${urs}%) makes prolonged holding risky. Negotiate quick bulk liquidation to local commercial canteens, hotel vendors, or mash/paste suppliers to secure ${money(marketRate)}/kg without transit degradation.`,
      highlights: [
        { label: 'Clearance Window', value: '2–4 Days' },
        { label: 'Target Channel', value: 'Institutional & Bulk Canteens' },
        { label: 'Price Benchmark', value: `${money(marketRate)} / kg` },
      ],
    }
  }, [gradeA, gradeB, urs, fairPrice, marketRate, report.pricing.premium])

  // Storage Strategy (Shelf-life & Curing)
  const store = useMemo(() => {
    if (rotten >= 3 || sprouted >= 3) {
      return {
        badge: 'Short-Term (<14 Days)',
        badgeClass: 'store',
        icon: Warehouse,
        title: 'Critical Spoilage & Moisture Control',
        action: 'Mandatory culling before storing',
        desc: `Presence of ${rotten}% rotten and ${sprouted}% sprouted bulbs indicates active moisture decay. DO NOT store in closed heaps or gunny sacks. Cull out rotten bulbs immediately to prevent Aspergillus niger (black mold) from infecting adjacent healthy bulbs.`,
        highlights: [
          { label: 'Max Safe Storage', value: '10–14 Days' },
          { label: 'Storage Method', value: 'Perforated Crates (No Sacks)' },
          { label: 'Critical Action', value: `Cull ${rotten}% rotten bulbs now` },
        ],
      }
    }
    return {
      badge: 'Mid to Long Term (60–90 Days)',
      badgeClass: 'store',
      icon: Warehouse,
      title: 'Aerated Chawl Storage Feasible',
      action: 'Cure 48h then store in ventilated racks',
      desc: `Bulb firmness and low moisture decay make this lot well-suited for extended storage. Field-cure under shade for 48–72 hours until neck tissue is completely dry. Store on raised bamboo racks (Kanda Chawl) with 65–70% relative humidity and continuous cross-ventilation.`,
      highlights: [
        { label: 'Holding Capacity', value: '60–90 Days' },
        { label: 'Optimal Storage Temp', value: '25°C – 30°C' },
        { label: 'Recommended Structure', value: 'Elevated Ventilated Chawl' },
      ],
    }
  }, [rotten, sprouted])

  // Processing & Value Addition Strategy (Fixing specific problems & salvaging value)
  const process = useMemo(() => {
    if (undersized >= 7 || damaged >= 4) {
      const defectTotal = undersized + damaged + rotten
      return {
        badge: 'Value Salvage (+30% Recovery)',
        badgeClass: 'process',
        icon: CookingPot,
        title: 'Dehydration & Processing Diversion',
        action: 'Convert sub-grade produce into value-add',
        desc: `Rather than selling the ${defectTotal}% sub-grade portion at distress discounts or dumping it, divert undersized (<40mm) and blemished bulbs to local dehydration units for onion flakes or onion powder. Local processing salvages 25–35% more revenue than distress mandi sales.`,
        highlights: [
          { label: 'Value Salvage', value: '+25% to +35% vs discard' },
          { label: 'Product Focus', value: 'Flakes, Powder, Puree' },
          { label: 'Target Channel', value: 'Dehydration & Food Units' },
        ],
      }
    }
    return {
      badge: 'Byproduct Value',
      badgeClass: 'process',
      icon: CookingPot,
      title: 'Culinary Supply & Trim Optimization',
      action: 'Clean trim & culinary supply',
      desc: `Cleanly trim non-grade bulbs (${urs}%) and direct them to food processing units or pickle manufacturers. Maintain 1.0 to 1.5-inch neck cuts to prevent bacterial soft rot during handling.`,
      highlights: [
        { label: 'Target Output', value: 'Peeled Onions / Paste' },
        { label: 'Neck Cut Length', value: '1.0 to 1.5 inches' },
        { label: 'Batch Salvage', value: '+10% total value' },
      ],
    }
  }, [undersized, damaged, rotten, urs])

  // Farm-Level Remediation Advisory
  const remediation = useMemo(() => {
    if (rotten >= 3) {
      return {
        title: 'Field Rot Remediation for Next Harvest',
        text: 'Excessive rot detected. In your next harvest, withhold field irrigation 12-15 days prior to uprooting. Ensure mandatory 4-day foliage-shade drying to seal neck wounds before bagging.',
      }
    }
    if (sprouted >= 3) {
      return {
        title: 'Sprout & Dormancy Control Advisory',
        text: 'Premature sprouting detected. Harvest immediately when 50% neck tops fall. For extended post-harvest storage, consider timing Maleic Hydrazide (MH) 2500 ppm spray 15 days before harvest when tops are still green.',
      }
    }
    if (undersized >= 8) {
      return {
        title: 'Bulb Caliber & Nutrition Correction',
        text: 'Over-representation of undersized bulbs (<45mm). Optimize seedling spacing to minimum 10x15cm. Ensure adequate Potash (SOP) and Sulphur application during bulb enlargement phase (45–60 DAT).',
      }
    }
    return {
      title: 'Quality Maintenance Best Practice',
      text: 'Harvest quality metrics indicate healthy field management. Keep harvest pallets off wet ground and avoid plastic gunny bags during transit to prevent heat buildup and scale loosening.',
    }
  }, [rotten, sprouted, undersized])

  return (
    <section className="ai-advisory-card" data-reveal-tier="2">
      <div className="ai-advisory-head">
        <div>
          <span className="eyebrow">Personalized AI Advisory</span>
          <h3>Sell, Store & Processing Strategies</h3>
          <p>Actionable guidance tailored to this lot’s quality metrics to maximize your farm profit.</p>
        </div>
        <span className="verified">
          <Lightbulb size={16} weight="fill" /> Advisory active
        </span>
      </div>

      <div className="ai-advisory-grid">
        {/* Pillar 1: Sell Strategy */}
        <div className="advisory-pillar">
          <div className="pillar-top">
            <span className={`pillar-badge ${sell.badgeClass}`}>{sell.badge}</span>
            <span className={`pillar-icon ${sell.badgeClass}`}>
              <sell.icon size={20} weight="bold" />
            </span>
          </div>
          <h4>1. Market & Sell Plan</h4>
          <div className="pillar-action">
            <ArrowRight size={15} weight="bold" /> {sell.action}
          </div>
          <p>{sell.desc}</p>
          <div className="pillar-highlights">
            {sell.highlights.map((h, i) => (
              <div key={i} className="pillar-highlight-item">
                <span>{h.label}</span>
                <b>{h.value}</b>
              </div>
            ))}
          </div>
        </div>

        {/* Pillar 2: Store Strategy */}
        <div className="advisory-pillar">
          <div className="pillar-top">
            <span className={`pillar-badge ${store.badgeClass}`}>{store.badge}</span>
            <span className={`pillar-icon ${store.badgeClass}`}>
              <store.icon size={20} weight="bold" />
            </span>
          </div>
          <h4>2. Storage & Preservation</h4>
          <div className="pillar-action">
            <ArrowRight size={15} weight="bold" /> {store.action}
          </div>
          <p>{store.desc}</p>
          <div className="pillar-highlights">
            {store.highlights.map((h, i) => (
              <div key={i} className="pillar-highlight-item">
                <span>{h.label}</span>
                <b>{h.value}</b>
              </div>
            ))}
          </div>
        </div>

        {/* Pillar 3: Process & Value Addition */}
        <div className="advisory-pillar">
          <div className="pillar-top">
            <span className={`pillar-badge ${process.badgeClass}`}>{process.badge}</span>
            <span className={`pillar-icon ${process.badgeClass}`}>
              <process.icon size={20} weight="bold" />
            </span>
          </div>
          <h4>3. Processing & Salvage</h4>
          <div className="pillar-action">
            <ArrowRight size={15} weight="bold" /> {process.action}
          </div>
          <p>{process.desc}</p>
          <div className="pillar-highlights">
            {process.highlights.map((h, i) => (
              <div key={i} className="pillar-highlight-item">
                <span>{h.label}</span>
                <b>{h.value}</b>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Farm Level Remediation Alert */}
      <div className="remediation-box">
        <WarningCircle size={24} weight="fill" />
        <div>
          <b>{remediation.title}</b>
          <p>{remediation.text}</p>
        </div>
      </div>
    </section>
  )
}

