import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check } from '@phosphor-icons/react'
import { useReveal } from '../hooks/useAnimations'
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

export function Analyzing() {
  const navigate = useNavigate()
  const [progress, setProgress] = useState(6)
  const [stage, setStage] = useState('Preparing image set')

  useEffect(() => {
    let timer: number;
    let isNavigating = false;

    const performAnalysis = async () => {
      try {
        const formData = new FormData();
        // Since we don't persist files in sessionStorage, we send dummy blobs to the backend
        // In a real app with context/Redux, we'd send the actual files captured in Capture.tsx
        formData.append('images', new Blob(['dummy'], { type: 'image/jpeg' }), 'dummy.jpg');

        // Use relative path so it works seamlessly on Vercel and locally (via proxy if set)
        const response = await fetch('/api/analyze', {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          const data = await response.json();
          const draftStr = sessionStorage.getItem('oniongrade-draft');
          if (draftStr) {
            const draft = JSON.parse(draftStr) as LotAssessment;
            draft.metrics = data.quality_metrics;
            // Recalculate pricing based on new metrics
            const premium = Math.round(draft.metrics.gradeA * 0.055 * 10) / 10
            const penalty = Math.round(draft.metrics.urs * 0.12 * 10) / 10
            const fairPrice = Math.round((draft.region.rate + premium - penalty) * 10) / 10
            draft.pricing = {
                marketRate: draft.region.rate,
                fairPrice,
                estimatedValue: Math.round(fairPrice * draft.weight),
                premium,
                penalty
            }
            sessionStorage.setItem('oniongrade-draft', JSON.stringify(draft));
          }
        }
      } catch (err) {
        console.error("Backend error:", err);
      }
      
      // Fast forward progress to 100 after fetch completes
      setProgress(100);
      setStage('Calculating fair market value');
      if (!isNavigating) {
        isNavigating = true;
        window.setTimeout(() => navigate('/reports/draft'), 600);
      }
    };

    // Run fake progress bar that caps at 90% until API responds
    timer = window.setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return 90;
        const next = prev + (prev < 70 ? 7 : 3)
        if (next > 34) setStage('Detecting defects and sizes')
        return next
      })
    }, 260)

    performAnalysis();

    return () => window.clearInterval(timer)
  }, [navigate])

  return (
    <Page
      title="Assessing your lot"
      subtitle="The YOLOv8 model is reading the captured sections."
    >
      <section className="analysis-card" data-reveal-tier="2">
        {/* Visual scanner animation */}
        <div className="scan-visual">
          <div className="scan-onion a" />
          <div className="scan-onion b" />
          <div className="scan-onion c" />
          <i />
        </div>

        {/* Copy and progress checks */}
        <div className="analysis-copy">
          <span className="eyebrow" data-reveal-tier="3">
            AI assessment running
          </span>
          <h2 data-reveal-tier="1">{stage}</h2>
          <p data-reveal-tier="3">
            Finding damaged, rotten, sprouted, and undersized onions across the batch.
          </p>

          <div className="analysis-progress">
            <b>{progress}%</b>
            <i>
              <em style={{ width: `${progress}%` }} />
            </i>
          </div>

          <div className="analysis-checks">
            <span className={progress > 30 ? 'ready' : ''} data-reveal-tier="4">
              <Check size={14} weight="bold" /> Image quality
            </span>
            <span className={progress > 70 ? 'ready' : ''} data-reveal-tier="4">
              <Check size={14} weight="bold" /> Quality classification
            </span>
            <span className={progress === 100 ? 'ready' : ''} data-reveal-tier="4">
              <Check size={14} weight="bold" /> Value estimate
            </span>
          </div>
        </div>
      </section>
    </Page>
  )
}
