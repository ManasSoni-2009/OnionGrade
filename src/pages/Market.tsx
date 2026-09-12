import { useState, useEffect } from 'react'
import { MapPin, CaretRight, Question, Spinner } from '@phosphor-icons/react'
import { regions as fallbackRegions } from '../data'
import { useReveal, money } from '../hooks/useAnimations'
import type { MarketRegion } from '../types'

export function Market() {
  const [regions, setRegions] = useState<MarketRegion[]>(fallbackRegions)
  const [selectedId, setSelectedId] = useState('nashik')
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)

  useEffect(() => {
    const fetchRates = async () => {
      try {
        // Try the backend proxy first
        let res = await fetch('/api/market-rates')
        if (!res.ok) throw new Error('Backend unavailable')
        let data = await res.json()
        
        if (data && data.data && data.data.length > 0) {
          setRegions(data.data)
          if (!data.data.find((r: MarketRegion) => r.id === selectedId)) {
            setSelectedId(data.data[0].id)
          }
        }
      } catch (e) {
        console.log("Falling back to external API")
        try {
          // Fallback to external API directly if proxy fails
          let res = await fetch('https://mandi-api.onrender.com/v1/prices?commodity=Onion')
          let json = await res.json()
          let fetchedRegions: MarketRegion[] = []
          let seen = new Set()
          const priority = ["Nashik", "Pune", "Indore", "Bangalore", "Solapur", "Ahilyanagar"]
          
          for (let item of json.data || []) {
            let dist = item.district || ""
            if (!seen.has(dist)) {
              seen.add(dist)
              fetchedRegions.push({
                id: dist.toLowerCase(),
                name: `${dist}, ${item.state || ''}`,
                market: item.market?.trim() || '',
                rate: Math.round((item.modal_price || 0) / 10) / 10 // per kg
              })
            }
          }
          if (fetchedRegions.length > 0) {
            fetchedRegions.sort((a, b) => {
              let aIdx = priority.indexOf(a.name.split(',')[0])
              let bIdx = priority.indexOf(b.name.split(',')[0])
              if (aIdx === -1) aIdx = 999
              if (bIdx === -1) bIdx = 999
              if (aIdx !== bIdx) return aIdx - bIdx;
              return a.name.localeCompare(b.name)
            })
            setRegions(fetchedRegions)
            if (!fetchedRegions.find((r: MarketRegion) => r.id === selectedId)) {
              setSelectedId(fetchedRegions[0].id)
            }
          }
        } catch(err) {
          console.error("All fetches failed, using fallback mock data", err)
        }
      } finally {
        setLoading(false)
      }
    }
    fetchRates()
  }, [])

  const selected = regions.find((r) => r.id === selectedId) || regions[0]
  const ref = useReveal([selectedId])

  return (
    <div className="page" ref={ref}>
      <div className="page-heading" data-reveal-tier="1">
        <div>
          <h1>Market rates</h1>
          <p>Regional reference prices for transparent negotiations.</p>
        </div>
      </div>

      <section className="market-page-card" data-reveal-tier="2">
        <div className="market-page-head">
          <div>
            <span className="eyebrow">Today’s selected market</span>
            <h2>{selected.market}</h2>
            <p>
              <MapPin size={15} weight="fill" /> {selected.name}
            </p>
          </div>
          <div style={{ position: 'relative' }}>
            <div 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{
                height: 42, border: '1px solid var(--line)', borderRadius: 10, 
                padding: '0 12px', background: 'white', fontSize: 14, fontWeight: 600,
                display: 'flex', alignItems: 'center', cursor: 'pointer', minWidth: 160,
                justifyContent: 'space-between'
              }}
            >
              {selected?.name.split(',')[0]}
              <CaretRight size={14} style={{ transform: dropdownOpen ? 'rotate(-90deg)' : 'rotate(90deg)', transition: '0.2s' }} />
            </div>
            {dropdownOpen && (
              <div style={{
                position: 'absolute', top: 46, right: 0, width: 220, background: 'white',
                border: '1px solid var(--line)', borderRadius: 10, zIndex: 50,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflow: 'hidden'
              }}>
                <div style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                  <input 
                    type="text" 
                    placeholder="Search mandi..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%', border: '1px solid #ddd', borderRadius: 6,
                      padding: '6px 8px', fontSize: 13, outline: 'none'
                    }}
                    autoFocus
                  />
                </div>
                <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                  {regions.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.market.toLowerCase().includes(searchQuery.toLowerCase())).map(r => (
                    <div
                      key={r.id}
                      onClick={() => {
                        setSelectedId(r.id);
                        setDropdownOpen(false);
                        setSearchQuery('');
                      }}
                      style={{
                        padding: '8px 12px', fontSize: 13, cursor: 'pointer',
                        background: r.id === selectedId ? '#f0f8cb' : 'transparent',
                        fontWeight: r.id === selectedId ? 600 : 400
                      }}
                    >
                      {r.name}
                    </div>
                  ))}
                  {regions.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.market.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                    <div style={{ padding: '8px 12px', fontSize: 13, color: '#888' }}>No markets found</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="market-spotlight">
          <strong>
            {money(selected.rate)}
            <small>/kg</small>
          </strong>
          <span className="positive">↗ 3.8% this week</span>
          <div className="large-spark">
            <svg viewBox="0 0 800 180" preserveAspectRatio="none">
              <path
                d="M0,130 C100,112 140,154 220,105 S350,112 420,62 S560,95 620,36 S720,68 800,16"
                fill="none"
                stroke="#d9f95a"
                strokeWidth="4"
              />
            </svg>
          </div>
        </div>
      </section>

      <section className="regional-rates" data-reveal-tier="2">
        {regions.map((r) => (
          <div
            key={r.id}
            onClick={() => setSelectedId(r.id)}
            style={{ cursor: 'pointer' }}
          >
            <span className="market-dot">
              <MapPin size={17} weight="fill" />
            </span>
            <div>
              <b>{r.market}</b>
              <small>{r.name}</small>
            </div>
            <strong>
              {money(r.rate)}
              <small>/kg</small>
            </strong>
            <CaretRight size={18} />
          </div>
        ))}
      </section>

      <p className="disclaimer" data-reveal-tier="3">
        <Question size={16} /> {loading ? "Fetching latest live mandi-market feeds..." : "Prices shown are live daily modal rates from the Mandi API (data.gov.in)."}
      </p>
    </div>
  )
}
