import { useStore } from '../store';
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, ArrowRight, MapPin, Sparkle } from '@phosphor-icons/react'
import { regions, createAssessment } from '../data'
import { CustomSelect } from '../components/CustomSelect'
import type { LotAssessment } from '../types'
import { useReveal, money } from '../hooks/useAnimations'

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

export function Assessment() {
  const addReport = useStore(state => state.addReport)
  const navigate = useNavigate()
  const [weight, setWeight] = useState('1250')
  const [variety, setVariety] = useState('Red')
  const [regionId, setRegionId] = useState('nashik')
  const [error, setError] = useState('')
  const [apiRegions, setApiRegions] = useState(regions)

  useEffect(() => {
    fetch('/api/market-rates')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success' && data.data && data.data.length > 0) {
          setApiRegions(data.data)
        }
      })
      .catch(err => console.error("Failed to fetch market rates", err))
  }, [])

  const selectedRegion = apiRegions.find((r) => r.id === regionId) || apiRegions[0]

  const handleContinue = () => {
    const numericWeight = Number(weight)
    if (!numericWeight || numericWeight < 10) {
      setError('Enter a lot weight of at least 10 kg.')
      return
    }

    const draft = createAssessment(numericWeight, variety, selectedRegion, 0)
    sessionStorage.setItem('oniongrade-draft', JSON.stringify(draft))
    navigate('/capture')
  }

  return (
    <Page
      title="Start a new assessment"
      subtitle="Tell us about the lot before you capture it."
    >
      <div className="form-layout">
        {/* Form Card (Left) */}
        <section className="form-card" data-reveal-tier="2">
          <div className="step-label" data-reveal-tier="4">
            <span>Step 1 of 3</span>
            <i className="active" />
            <i />
            <i />
          </div>

          <h2 data-reveal-tier="1">Lot information</h2>
          <p className="card-intro" data-reveal-tier="3">
            Use the closest market so the estimate reflects your local procurement price.
          </p>

          <div className="field">
            <span>Onion variety</span>
            <div className="flex gap-3">
              <button
                type="button"
                className={`flex-1 py-3 px-4 rounded-xl border-2 font-semibold transition-all ${
                  variety === 'Red' 
                    ? 'border-[#d9f95a] bg-[#f0fad2] text-[#5b7a13]' 
                    : 'border-[#eaeaea] bg-white text-[#777] hover:border-[#ddd]'
                }`}
                onClick={() => setVariety('Red')}
              >
                Red
              </button>
              <button
                type="button"
                className={`flex-1 py-3 px-4 rounded-xl border-2 font-semibold transition-all ${
                  variety === 'White' 
                    ? 'border-[#d9f95a] bg-[#f0fad2] text-[#5b7a13]' 
                    : 'border-[#eaeaea] bg-white text-[#777] hover:border-[#ddd]'
                }`}
                onClick={() => setVariety('White')}
              >
                White
              </button>
            </div>
          </div>

          <label className="field">
            <span>Total produce weight (kg)</span>
            <div className="suffix-input">
              <input
                type="text"
                inputMode="numeric"
                value={weight}
                onChange={(e) => {
                  setWeight(e.target.value.replace(/[^0-9]/g, ''))
                  if (error) setError('')
                }}
                placeholder="e.g. 1250"
              />
              <b>kg</b>
            </div>
          </label>

          <div className="field">
            <span>Region / reference market</span>
            <CustomSelect
              options={apiRegions.map(r => ({ value: r.id, label: r.name }))}
              value={regionId}
              onChange={setRegionId}
              showSearch={true}
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <button
            type="button"
            className="button button-primary button-full"
            onClick={handleContinue}
          >
            Continue to capture <Camera size={18} weight="fill" />
          </button>
        </section>

        {/* Estimate Card (Right) */}
        <aside className="estimate-card" data-reveal-tier="2">
          <span className="eyebrow" data-reveal-tier="3">
            Live market reference
          </span>

          <div className="market-pin">
            <MapPin size={19} weight="fill" data-reveal-tier="4" />
            <div>
              <b>{selectedRegion.market}</b>
              <small>Updated today · simulated</small>
            </div>
          </div>

          <strong>
            {money(selectedRegion.rate)}
            <small>/kg</small>
          </strong>

          <p data-reveal-tier="3">
            Quality adjustment is calculated after the AI assessment.
          </p>

          <div className="estimate-note">
            <Sparkle size={17} weight="fill" data-reveal-tier="4" />
            <span>
              Capture 5–10 overhead images for a more representative result.
            </span>
          </div>
        </aside>
      </div>
    </Page>
  )
}

