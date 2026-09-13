import { useStore } from '../store';
import { Link, NavLink } from 'react-router-dom'
import {
  Plus,
  MapPin,
  SealCheck,
  ArrowRight,
  CaretRight,
  DotsThree,
  Sliders,
  CaretDown,
  Basket,
  Sparkle,
  ChartLineUp,
} from '@phosphor-icons/react'
import { useReveal, money, formatDate } from '../hooks/useAnimations'
import type { LotAssessment } from '../types'

interface PageProps {
  title: string
  subtitle: string
  actions?: React.ReactNode
  children: React.ReactNode
}

function Page({ title, subtitle, actions, children }: PageProps) {
  const ref = useReveal()
  return (
    <div className="page" ref={ref}>
      <div className="page-heading">
        <div>
          <h1 data-reveal-tier="1">{title}</h1>
          <p data-reveal-tier="3">{subtitle}</p>
        </div>
        {actions}
      </div>
      {children}
    </div>
  )
}

interface MetricBarProps {
  label: string
  value: number
  tone: 'lime' | 'violet' | 'coral' | string
}

function MetricBar({ label, value, tone }: MetricBarProps) {
  return (
    <div className="metric-bar">
      <div>
        <span>{label}</span>
        <b>{value}%</b>
      </div>
      <i>
        <em className={tone} style={{ width: `${value}%` }} />
      </i>
    </div>
  )
}

export function Dashboard() {
  const reports = useStore(state => state.reports)
  const current = reports[0]

  if (!current) {
    return (
      <Page
        title="Harvest overview"
        subtitle="Clear quality insights for every onion lot."
        actions={
          <Link className="button button-primary" to="/assessment">
            <Plus size={18} weight="bold" /> New assessment
          </Link>
        }
      >
        <p>No assessment reports found. Start a new assessment to begin.</p>
      </Page>
    )
  }

  return (
    <Page
      title="Harvest overview"
      subtitle="Clear quality insights for every onion lot."
      actions={
        <Link className="button button-primary" to="/assessment">
          <Plus size={18} weight="bold" /> New assessment
        </Link>
      }
    >
      <div className="dashboard-grid">
        {/* 1. Hero Card */}
        <section className="hero-card" data-reveal-tier="2">
          <div className="hero-card-top">
            <div>
              <span className="eyebrow" data-reveal-tier="3">
                Latest verified lot
              </span>
              <h2>{current.variety}</h2>
              <p>
                <MapPin size={14} weight="regular" />
                {current.region.market} · {formatDate(current.capturedAt)}
              </p>
            </div>
            <span className="verified" data-reveal-tier="4">
              <SealCheck size={16} weight="fill" /> Verified
            </span>
          </div>

          <div className="quality-dial">
            <div
              className="dial"
              style={{
                background: `conic-gradient(var(--lime) 0 ${current.metrics.gradeA}%, #55575c ${current.metrics.gradeA}% 100%)`,
              }}
            >
              <b>
                {current.metrics.gradeA}
                <small>%</small>
              </b>
              <span>Grade A</span>
            </div>

            <div className="hero-stats">
              <div>
                <span data-reveal-tier="3">Fair price</span>
                <strong>
                  {money(current.pricing.fairPrice)}
                  <small>/kg</small>
                </strong>
                <em>
                  +{money(current.pricing.fairPrice - current.pricing.marketRate)} vs market
                </em>
              </div>
              <div>
                <span data-reveal-tier="3">Lot value</span>
                <strong>{money(current.pricing.estimatedValue)}</strong>
                <em>{current.weight.toLocaleString('en-IN')} kg assessed</em>
              </div>
            </div>
          </div>

          <Link to={`/reports/${current.id}`} className="card-link">
            View full report <ArrowRight size={16} weight="bold" />
          </Link>
        </section>

        {/* 2. Market Card */}
        <Link to="/market" className="market-card" data-reveal-tier="2" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
          <div className="card-head">
            <div>
              <span className="eyebrow" data-reveal-tier="3">
                Today’s local market
              </span>
              <h3>{current.region.market}</h3>
            </div>
            <DotsThree size={19} weight="bold" data-reveal-tier="4" />
          </div>

          <strong className="market-price">
            {money(current.pricing.marketRate)}
            <small>/kg</small>
          </strong>

          <div className="sparkline">
            {[26, 32, 29, 37, 31, 43, 39, 55, 49, 63, 58, 72].map((value, index) => (
              <i key={index} style={{ height: `${value}%` }} />
            ))}
          </div>

          <p>
            <span className="positive">↗ 3.8%</span> compared to last week
          </p>
        </Link>

        {/* 3. Metrics Card */}
        <section className="metrics-card" data-reveal-tier="2">
          <div className="card-head">
            <div>
              <span className="eyebrow" data-reveal-tier="3">
                Lot quality split
              </span>
              <h3>At a glance</h3>
            </div>
            <Sliders size={18} weight="regular" data-reveal-tier="4" />
          </div>

          <div className="split-bars">
            <MetricBar label="Grade A" value={current.metrics.gradeA} tone="lime" />
            <MetricBar label="Grade B" value={current.metrics.gradeB} tone="violet" />
            <MetricBar label="URS" value={current.metrics.urs} tone="coral" />
          </div>

          <Link to={`/reports/${current.id}`} className="card-link">
            See quality details <ArrowRight size={16} weight="bold" />
          </Link>
        </section>

        {/* 4. Trend Card (spans 2 cols) */}
        <section className="trend-card" data-reveal-tier="2">
          <div className="card-head">
            <div>
              <span className="eyebrow" data-reveal-tier="3">
                Quality consistency
              </span>
              <h3>Last 6 assessments</h3>
            </div>
            <button type="button" className="select-button">
              Monthly <CaretDown size={15} weight="bold" />
            </button>
          </div>

          <div className="line-chart">
            <svg viewBox="0 0 520 160" preserveAspectRatio="none">
              <defs>
                <linearGradient id="trendGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop stopColor="#d9f95a" stopOpacity="0.48" />
                  <stop offset="1" stopColor="#d9f95a" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0,124 C55,109 67,122 111,103 S169,106 205,75 S264,89 304,60 S374,70 408,37 S471,51 520,19 L520,160 L0,160Z"
                fill="url(#trendGradient)"
              />
              <path
                d="M0,124 C55,109 67,122 111,103 S169,106 205,75 S264,89 304,60 S374,70 408,37 S471,51 520,19"
                fill="none"
                stroke="#d9f95a"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div className="chart-labels">
            <span>Apr</span>
            <span>May</span>
            <span>Jun</span>
            <span>Jul</span>
            <span>Aug</span>
            <span>Sep</span>
          </div>
        </section>

        {/* 5. Recent Card (spans 2 cols) */}
        <section className="recent-card" data-reveal-tier="2">
          <div className="card-head">
            <div>
              <span className="eyebrow" data-reveal-tier="3">
                Recent reports
              </span>
              <h3>Keep track of every lot</h3>
            </div>
            <Link to="/reports" className="mini-link">
              View all
            </Link>
          </div>

          {reports.slice(0, 3).map((report, index) => (
            <Link className="report-row" key={`${report.id}-${index}`} to={`/reports/${report.id}`}>
              <span className="lot-thumb" data-reveal-tier="4">
                <Basket size={18} weight="fill" />
              </span>
              <div>
                <b>{report.code}</b>
                <small>
                  {report.variety} · {formatDate(report.capturedAt)}
                </small>
              </div>
              <strong>
                {report.metrics.gradeA}%<small> A</small>
              </strong>
              <CaretRight size={18} weight="bold" />
            </Link>
          ))}
        </section>
      </div>
    </Page>
  )
}

