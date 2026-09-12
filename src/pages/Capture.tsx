import { useState, useMemo } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import {
  Camera,
  ArrowLeft,
  ArrowRight,
  ImageSquare,
  UploadSimple,
  Sparkle,
  X,
  Basket,
} from '@phosphor-icons/react'
import type { LotAssessment, CaptureImage } from '../types'
import { useReveal } from '../hooks/useAnimations'

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

// Client-side exact file hash to prevent duplicate images
async function computeFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function Capture() {
  const navigate = useNavigate()
  const draft = useMemo(() => {
    try {
      const stored = sessionStorage.getItem('oniongrade-draft')
      return stored ? (JSON.parse(stored) as LotAssessment) : null
    } catch {
      return null
    }
  }, [])

  const [images, setImages] = useState<CaptureImage[]>([])
  const [showUpload, setShowUpload] = useState(false)
  const [error, setError] = useState('')
  const [uploadedHashes, setUploadedHashes] = useState<Set<string>>(new Set())

  if (!draft) {
    return <Navigate to="/assessment" replace />
  }

  // Dynamic constraints based on lot weight
  const minImages = draft.weight > 2000 ? 10 : draft.weight > 500 ? 5 : 3;

  const handleFiles = async (files: FileList | null) => {
    if (!files) return
    const remainingSlots = 10 - images.length
    
    let addedCount = 0;
    const newImages: CaptureImage[] = [];
    const newHashes = new Set(uploadedHashes);

    for (let i = 0; i < files.length; i++) {
      if (addedCount >= remainingSlots) break;
      const file = files[i];
      const hash = await computeFileHash(file);
      
      if (newHashes.has(hash)) {
        setError(`Duplicate image rejected: ${file.name} has already been uploaded for this batch.`);
        continue;
      }
      
      newHashes.add(hash);
      newImages.push({ id: `${Date.now()}-${i}`, name: file.name, file }); // Store file obj to send to backend
      addedCount++;
    }

    if (newImages.length > 0) {
      setImages((prev) => [...prev, ...newImages])
      setUploadedHashes(newHashes)
      if (!error || error.includes('rejected')) setError('') // Clear error if successful uploads happened
    }
    setShowUpload(false)
  }
  
  // Dummy capture for demo
  const addCapture = (name = `Section ${images.length + 1}`) => {
    setImages((prev) => [...prev, { id: `${Date.now()}-${prev.length}`, name }])
    setError('')
  }

  const continueFlow = () => {
    if (images.length < minImages) {
      setError(`Capture at least ${minImages} sections of the lot before analysis (due to weight of ${draft.weight}kg).`)
      return
    }
    draft.imageCount = images.length
    sessionStorage.setItem('oniongrade-draft', JSON.stringify(draft))
    navigate('/analyzing')
  }

  return (
    <Page
      title="Capture the onion lot"
      subtitle="Take overhead images from different sections for a fair result."
      actions={
        <button
          type="button"
          className="text-button"
          onClick={() => navigate('/assessment')}
        >
          <ArrowLeft size={16} /> Edit lot details
        </button>
      }
    >
      <div className="capture-layout">
        {/* Camera Viewfinder Card */}
        <section className="camera-card" data-reveal-tier="2">
          <div className="camera-top">
            <span>
              <i className="status-dot" /> Lighting good
            </span>
            <span>
              Level <b>●</b>
            </span>
          </div>

          <div className="viewfinder">
            <div className="camera-grid" />
            <div className="focus-ring">
              <span />
            </div>
            <div className="camera-hint">
              <Sparkle size={16} weight="fill" data-reveal-tier="4" /> Keep onions spread in a single layer
            </div>
          </div>

          <div className="camera-controls">
            <button
              type="button"
              className="small-control"
              onClick={() => setShowUpload((prev) => !prev)}
            >
              <ImageSquare size={20} />
              <span>Upload</span>
            </button>
            <button
              type="button"
              className="shutter"
              aria-label="Capture image"
              onClick={() => addCapture()}
            >
              <i />
            </button>
            <button
              type="button"
              className="small-control"
              onClick={() => addCapture()}
            >
              <Camera size={20} weight="fill" />
              <span>Capture</span>
            </button>
          </div>

          {showUpload && (
            <label className="upload-strip">
              <UploadSimple size={18} />
              <span>Choose images from device</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleFiles(e.target.files)}
              />
            </label>
          )}
        </section>

        {/* Capture Side / Thumbnails */}
        <aside className="capture-side" data-reveal-tier="2">
          <div className="step-label" data-reveal-tier="4">
            <span>Step 2 of 3</span>
            <i className="done" />
            <i className="active" />
            <i />
          </div>

          <h2 data-reveal-tier="1">Batch coverage</h2>
          <p data-reveal-tier="3">
            Move around the lot and capture a new section each time. Weight: {draft.weight}kg.
          </p>

          <div className="capture-count">
            <b>{images.length}</b>
            <span>of {minImages} minimum images</span>
            <div>
              <i style={{ width: `${Math.min(images.length / minImages, 1) * 100}%` }} />
            </div>
          </div>

          <div className="thumb-grid">
            {Array.from({ length: Math.max(minImages, images.length) }, (_, index) =>
              images[index] ? (
                <button
                  key={images[index].id}
                  type="button"
                  className="capture-thumb"
                  onClick={() =>
                    setImages((prev) => prev.filter((_, i) => i !== index))
                  }
                  title={`Remove ${images[index].name}`}
                >
                  <Basket size={20} weight="fill" />
                  <span>{index + 1}</span>
                  <X size={13} weight="bold" />
                </button>
              ) : (
                <div key={index} className="capture-placeholder">
                  {index + 1}
                </div>
              )
            )}
          </div>

          {error && <p className="form-error">{error}</p>}

          <button
            type="button"
            className="button button-primary button-full"
            onClick={continueFlow}
          >
            Analyze {images.length > 0 ? `${images.length} images` : ''} <ArrowRight size={18} />
          </button>

          <small data-reveal-tier="3">
            Duplicate images will be automatically rejected.
          </small>
        </aside>
      </div>
    </Page>
  )
}
