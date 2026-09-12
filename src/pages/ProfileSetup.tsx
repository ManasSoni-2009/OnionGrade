import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from '@phosphor-icons/react'
import { Brand } from '../components/Brand'
import { useReveal } from '../hooks/useAnimations'
import { regions } from '../data'
import { CustomSelect } from '../components/CustomSelect'

import { useStore } from '../store'

export function ProfileSetup() {
  const [name, setName] = useState('Arjun Patil')
  const [regionId, setRegionId] = useState('nashik')
  const setProfile = useStore(state => state.setProfile)
  const navigate = useNavigate()
  const ref = useReveal()

  const handleComplete = () => {
    setProfile(name)
    navigate('/dashboard')
  }

  return (
    <main className="auth-page" ref={ref}>
      <div className="auth-card" data-reveal data-reveal-tier="2">
        <Brand />

        <div className="stepper" data-reveal-tier="4">
          <span className="active">1</span>
          <i />
          <span className="active">2</span>
          <i />
          <span>3</span>
        </div>

        <div className="eyebrow" data-reveal-tier="3">
          Set up your profile
        </div>

        <h1 data-reveal-tier="1">A few details, then you’re ready.</h1>

        <p data-reveal-tier="3">
          This helps keep every quality report tied to the correct farmer and lot.
        </p>

        <label className="field" data-reveal-tier="3">
          <span>Full name</span>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            aria-label="Full name"
          />
        </label>

        <div className="field" data-reveal-tier="3">
          <span>Primary region</span>
          <CustomSelect
            options={regions.map(r => ({ value: r.id, label: r.name }))}
            value={regionId}
            onChange={setRegionId}
          />
        </div>

        <button
          type="button"
          className="button button-primary button-full"
          onClick={handleComplete}
          data-reveal-tier="3"
        >
          Open my dashboard <ArrowRight size={18} weight="regular" />
        </button>

        <small data-reveal-tier="4">You can update this later in settings.</small>
      </div>
    </main>
  )
}
