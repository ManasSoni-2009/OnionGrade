import { useEffect, useLayoutEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  ArrowRight, Sparkle, SealCheck, ShieldCheck, Wallet,
  Camera, FileText, ChartLineUp, Plant,
} from '@phosphor-icons/react'
import { Brand } from '../components/Brand'

gsap.registerPlugin(ScrollTrigger)

/* ------------------------------------------------------------------ */
/*  SECTION 1 — Hero                                                  */
/* ------------------------------------------------------------------ */

function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)

  useLayoutEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced || !sectionRef.current) return

    const ctx = gsap.context(() => {
      /* Word stagger on heading */
      const words = headingRef.current?.querySelectorAll('.hero-word')
      if (words?.length) {
        gsap.fromTo(words, {
          y: 50, opacity: 0, filter: 'blur(6px)', rotationX: -8,
        }, {
          y: 0, opacity: 1, filter: 'blur(0px)', rotationX: 0,
          duration: 0.78, stagger: 0.12, ease: 'power4.out',
          delay: 0.2, clearProps: 'filter,rotationX',
        })
      }

      /* Subtitle + CTA fade in */
      gsap.fromTo('.hero-subtitle', { y: 20, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.5, ease: 'power2.out', delay: 0.9,
      })
      gsap.fromTo('.hero-cta-group', { y: 20, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.5, ease: 'power2.out', delay: 1.1,
      })

      /* Blob parallax on scroll */
      gsap.utils.toArray<HTMLElement>('.hero-blob').forEach((blob, i) => {
        gsap.to(blob, {
          y: (i + 1) * -60,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 1,
          },
        })
      })

      /* Blob breathing */
      gsap.utils.toArray<HTMLElement>('.hero-blob').forEach((blob, i) => {
        gsap.to(blob, {
          scale: 1.06 + i * 0.02,
          duration: 4 + i,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
        })
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section className="landing-hero" ref={sectionRef}>
      <div className="hero-grain" />
      <div className="hero-blobs">
        <span className="hero-blob blob-1" />
        <span className="hero-blob blob-2" />
        <span className="hero-blob blob-3" />
        <span className="hero-blob blob-4" />
      </div>

      <div className="hero-content">
        <Brand light />
        <h1 className="hero-heading" ref={headingRef}>
          <span className="hero-word">Know</span>{' '}
          <span className="hero-word">your</span>{' '}
          <span className="hero-word">lot.</span>
          <br />
          <span className="hero-word hero-accent">Own</span>{' '}
          <span className="hero-word hero-accent">your</span>{' '}
          <span className="hero-word hero-accent">value.</span>
        </h1>
        <p className="hero-subtitle">
          Assess onion quality in minutes, see a fair regional estimate,
          and share a verified report with confidence.
        </p>
        <div className="hero-cta-group">
          <Link className="button button-primary button-large hero-btn-primary" to="/assessment">
            Get started <ArrowRight size={19} weight="bold" />
          </Link>
          <Link to="/dealer" className="hero-btn-dealer">
            I'm a dealer — verify a report <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  SECTION 2 — Stats Marquee                                         */
/* ------------------------------------------------------------------ */

const modelStats = [
  { label: '94% AI Confidence' },
  { label: '4 Market Regions' },
  { label: '<30s Assessment' },
  { label: 'Grade A / B / URS Classification' },
  { label: 'Image-Backed Reports' },
  { label: 'Verified & Shareable' },
  { label: 'Fair Price Estimation' },
  { label: 'Defect Detection' },
]

function StatsMarquee() {
  const trackRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced || !trackRef.current) return

    const ctx = gsap.context(() => {
      gsap.fromTo(trackRef.current, { opacity: 0, y: 20 }, {
        opacity: 1, y: 0, duration: 0.6, ease: 'power2.out',
        scrollTrigger: { trigger: trackRef.current, start: 'top 85%' },
      })
    }, trackRef)

    return () => ctx.revert()
  }, [])

  const items = modelStats.map(s => s.label)
  const doubled = [...items, ...items]

  return (
    <section className="landing-marquee" ref={trackRef}>
      <div className="marquee-track">
        {doubled.map((label, i) => (
          <span key={i} className="marquee-item">
            <span className="marquee-diamond">◆</span>
            {label}
          </span>
        ))}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  SECTION 3 — Features Bento                                        */
/* ------------------------------------------------------------------ */

function FeaturesBento() {
  const sectionRef = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced || !sectionRef.current) return

    const ctx = gsap.context(() => {
      gsap.fromTo('.bento-heading', {
        y: 40, opacity: 0, scale: 0.92, filter: 'blur(6px)',
      }, {
        y: 0, opacity: 1, scale: 1, filter: 'blur(0px)',
        duration: 0.7, ease: 'power4.out', clearProps: 'filter,scale',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 75%' },
      })

      gsap.fromTo('.bento-card', {
        y: 35, opacity: 0, scale: 0.96,
      }, {
        y: 0, opacity: 1, scale: 1,
        duration: 0.55, stagger: 0.1, ease: 'back.out(1.1)',
        clearProps: 'scale',
        scrollTrigger: { trigger: '.bento-grid', start: 'top 80%' },
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section className="landing-features" ref={sectionRef}>
      <div className="landing-container">
        <span className="landing-eyebrow">Capabilities</span>
        <h2 className="bento-heading">What OnionGrade does</h2>
        <div className="bento-grid">
          <div className="bento-card bento-large">
            <div className="bento-icon bento-icon-lime"><Camera size={28} weight="duotone" /></div>
            <h3>AI-Powered Grading</h3>
            <p>Identify damaged, rotten, sprouted, and undersized onions across the entire batch with image analysis.</p>
            <div className="bento-donut-mini">
              <div className="bento-donut-ring" />
              <span>75%<small>Grade A</small></span>
            </div>
          </div>
          <div className="bento-card">
            <div className="bento-icon bento-icon-green"><ChartLineUp size={24} weight="duotone" /></div>
            <h3>Fair Regional Pricing</h3>
            <p>Quality-adjusted price estimates based on live market references from your closest APMC.</p>
          </div>
          <div className="bento-card">
            <div className="bento-icon bento-icon-violet"><FileText size={24} weight="duotone" /></div>
            <h3>Instant Digital Reports</h3>
            <p>Get a verified, time-stamped quality report you can share, print, or export as PDF.</p>
          </div>
          <div className="bento-card bento-small">
            <div className="bento-icon bento-icon-coral"><ShieldCheck size={24} weight="duotone" /></div>
            <h3>Dealer Verification</h3>
            <p>Dealers scan a QR code to verify your lot quality instantly.</p>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  SECTION 4 — How It Works                                          */
/* ------------------------------------------------------------------ */

const steps = [
  { icon: Camera, title: 'Capture', desc: 'Photograph your onion lot from multiple angles' },
  { icon: Sparkle, title: 'Analyze', desc: 'AI assesses grade, defects, and sizing in seconds' },
  { icon: FileText, title: 'Report', desc: 'Get a verified, shareable quality report' },
]

function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null)
  const pathRef = useRef<SVGPathElement>(null)

  useLayoutEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced || !sectionRef.current) return

    const ctx = gsap.context(() => {
      gsap.fromTo('.hiw-heading', {
        y: 40, opacity: 0, scale: 0.92, filter: 'blur(6px)',
      }, {
        y: 0, opacity: 1, scale: 1, filter: 'blur(0px)',
        duration: 0.7, ease: 'power4.out', clearProps: 'filter,scale',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 75%' },
      })

      /* Path drawing */
      if (pathRef.current) {
        const length = pathRef.current.getTotalLength()
        gsap.set(pathRef.current, { strokeDasharray: length, strokeDashoffset: length })
        gsap.to(pathRef.current, {
          strokeDashoffset: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: '.hiw-stepper',
            start: 'top 70%',
            end: 'bottom 50%',
            scrub: 1,
          },
        })
      }

      /* Step reveals */
      gsap.fromTo('.hiw-step', { y: 25, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.5, stagger: 0.2, ease: 'back.out(1.1)',
        scrollTrigger: { trigger: '.hiw-stepper', start: 'top 72%' },
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section className="landing-hiw" ref={sectionRef}>
      <div className="landing-container">
        <span className="landing-eyebrow">How it works</span>
        <h2 className="hiw-heading">Three steps to fair value</h2>
        <div className="hiw-stepper">
          <svg className="hiw-path-svg" viewBox="0 0 800 4" preserveAspectRatio="none">
            <path ref={pathRef} d="M0,2 L800,2" stroke="#d9f95a" strokeWidth="3" fill="none" strokeLinecap="round" />
          </svg>
          {steps.map((step, i) => (
            <div className="hiw-step" key={i}>
              <div className="hiw-step-num">{String(i + 1).padStart(2, '0')}</div>
              <div className="hiw-step-icon"><step.icon size={28} weight="duotone" /></div>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  SECTION 5 — Trust + CTA                                           */
/* ------------------------------------------------------------------ */

function TrustCTA() {
  const sectionRef = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced || !sectionRef.current) return

    const ctx = gsap.context(() => {
      gsap.fromTo('.cta-heading', {
        y: 50, opacity: 0, scale: 0.88, filter: 'blur(8px)',
      }, {
        y: 0, opacity: 1, scale: 1, filter: 'blur(0px)',
        duration: 0.8, ease: 'power4.out', clearProps: 'filter,scale',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 70%' },
      })

      gsap.fromTo('.cta-buttons', { y: 25, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.5, delay: 0.2, ease: 'power2.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 65%' },
      })

      gsap.fromTo('.cta-trust-row span', { y: 10, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.35, stagger: 0.08, ease: 'power2.out',
        scrollTrigger: { trigger: '.cta-trust-row', start: 'top 85%' },
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section className="landing-cta" ref={sectionRef}>
      <div className="hero-grain" />
      <div className="cta-blobs">
        <span className="hero-blob blob-cta-1" />
        <span className="hero-blob blob-cta-2" />
      </div>
      <div className="landing-container cta-inner">
        <h2 className="cta-heading">Start assessing today.</h2>
        <div className="cta-buttons">
          <Link className="button button-primary button-large" to="/assessment">
            Get started as a farmer <ArrowRight size={19} weight="bold" />
          </Link>
          <Link className="button button-secondary button-large" to="/dealer">
            <ShieldCheck size={19} /> Verify a report
          </Link>
        </div>
        <div className="cta-trust-row">
          <span><SealCheck size={17} weight="fill" /> AI-Assisted</span>
          <span><ShieldCheck size={17} weight="fill" /> Report Ready</span>
          <span><Wallet size={17} weight="fill" /> Fair Pricing</span>
        </div>
      </div>
      <footer className="landing-footer">
        <Brand />
        <small>OnionGrade · Transparent procurement · SIH 2026</small>
      </footer>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  Welcome — Composed Landing Page                                   */
/* ------------------------------------------------------------------ */

export function Welcome() {
  useEffect(() => {
    window.scrollTo(0, 0)
    return () => { ScrollTrigger.getAll().forEach(t => t.kill()) }
  }, [])

  return (
    <main className="landing-page">
      <HeroSection />
      <StatsMarquee />
      <FeaturesBento />
      <HowItWorks />
      <TrustCTA />
    </main>
  )
}
