import { useState } from 'react'
import { GearSix } from '@phosphor-icons/react'
import { useReveal } from '../hooks/useAnimations'

const storageKey = 'oniongrade-reports'

import { useStore } from "../store"

export function Settings() {
  const notify = useStore(state => state.notify)
  const clearReports = useStore(state => state.clearReports)
  const ref = useReveal()
  const [notifications, setNotifications] = useState(true)
  const [reportStorage, setReportStorage] = useState(true)
  const [reducedMotion, setReducedMotion] = useState(false)

  const handleClear = () => {
    localStorage.removeItem(storageKey)
    notify('Demo reports cleared — refresh to reseed')
  }

  return (
    <div className="page" ref={ref}>
      <div className="page-heading" data-reveal-tier="1">
        <div>
          <h1>Settings</h1>
          <p>Manage your local OnionGrade preferences.</p>
        </div>
      </div>

      <section className="settings-card" data-reveal-tier="2">
        <div className="settings-profile">
          <span className="avatar large">AP</span>
          <div>
            <h3>Arjun Patil</h3>
            <p>Farmer account · Nashik, Maharashtra</p>
          </div>
          <button
            type="button"
            className="button button-secondary"
            onClick={() => notify('Profile edit available in full release')}
          >
            <GearSix size={16} /> Edit profile
          </button>
        </div>

        <div className="setting-row">
          <div>
            <b>Notifications</b>
            <span>Assessment updates and market movement</span>
          </div>
          <button
            type="button"
            className={`switch ${notifications ? 'on' : ''}`}
            onClick={() => {
              const next = !notifications
              setNotifications(next)
              notify(next ? 'Notifications enabled' : 'Notifications disabled')
            }}
            aria-label="Toggle notifications"
          >
            <i />
          </button>
        </div>

        <div className="setting-row">
          <div>
            <b>Report storage</b>
            <span>Store reports on this device</span>
          </div>
          <button
            type="button"
            className={`switch ${reportStorage ? 'on' : ''}`}
            onClick={() => {
              const next = !reportStorage
              setReportStorage(next)
              notify(next ? 'Local report storage enabled' : 'Local report storage disabled')
            }}
            aria-label="Toggle report storage"
          >
            <i />
          </button>
        </div>

        <div className="setting-row">
          <div>
            <b>Reduced motion</b>
            <span>Respect system accessibility preferences</span>
          </div>
          <button
            type="button"
            className={`switch ${reducedMotion ? 'on' : ''}`}
            onClick={() => {
              const next = !reducedMotion
              setReducedMotion(next)
              notify(next ? 'Reduced motion enabled' : 'Standard motion enabled')
            }}
            aria-label="Toggle reduced motion"
          >
            <i />
          </button>
        </div>
      </section>

      <section className="settings-card danger-zone" data-reveal-tier="2">
        <h3>Demo data</h3>
        <p>Local reports can be cleared from this browser at any time.</p>
        <button
          type="button"
          className="button button-secondary"
          onClick={handleClear}
        >
          Clear local reports
        </button>
      </section>
    </div>
  )
}
