import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus,
  MagnifyingGlass,
  Sliders,
  Basket,
  SealCheck,
  CaretRight,
} from '@phosphor-icons/react'
import type { LotAssessment } from '../types'
import { useReveal, money, formatDate } from '../hooks/useAnimations'

import { useStore } from '../store'

export function Reports() {
  const reports = useStore(state => state.reports)
  const [query, setQuery] = useState('')
  const filtered = reports.filter((r) =>
    `${r.code}${r.variety}${r.region.name}`.toLowerCase().includes(query.toLowerCase())
  )
  const ref = useReveal([reports, query])

  return (
    <div className="page" ref={ref}>
      <div className="page-heading" data-reveal-tier="1">
        <div>
          <h1>Quality reports</h1>
          <p>Every assessment is stored on this device.</p>
        </div>
        <Link className="button button-primary" to="/assessment">
          <Plus size={18} />
          New assessment
        </Link>
      </div>

      <div className="reports-toolbar" data-reveal-tier="3">
        <label className="search-box">
          <MagnifyingGlass size={18} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search report or variety"
          />
        </label>
        <button className="filter-button" type="button">
          <Sliders size={18} />
          Filters
        </button>
      </div>

      <section className="reports-list">
        {filtered.map((report) => (
          <ReportItem key={report.id} report={report} />
        ))}
      </section>
    </div>
  )
}

interface ReportItemProps {
  report: LotAssessment
}

function ReportItem({ report }: ReportItemProps) {
  return (
    <Link to={`/reports/${report.id}`} className="report-item" data-reveal-tier="2">
      <span className="report-icon">
        <Basket size={22} />
      </span>
      <div className="report-info">
        <div>
          {report.isGuest ? (
            <span className="verified" data-reveal-tier="4" style={{ background: '#fce4e4', color: '#8a2b2b', boxShadow: '0 0 0 1px rgba(201, 69, 50, 0.1)' }}>
              <Basket size={15} weight="fill" /> Unsaved
            </span>
          ) : (
            <span className="verified" data-reveal-tier="4">
              <SealCheck size={15} weight="fill" /> Verified
            </span>
          )}
          <b>{report.code}</b>
        </div>
        <p>
          {report.variety} · {report.weight.toLocaleString('en-IN')} kg · {formatDate(report.capturedAt)}
        </p>
      </div>
      <div className="report-grade">
        <b>{report.metrics.gradeA}%</b>
        <span>Grade A</span>
      </div>
      <div className="report-value">
        <b>{money(report.pricing.fairPrice)}</b>
        <span>fair / kg</span>
      </div>
      <CaretRight size={20} />
    </Link>
  )
}
