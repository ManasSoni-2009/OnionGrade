import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { gsap } from 'gsap'

/* ------------------------------------------------------------------ */
/*  4-Tier Animation System                                           */
/*  Tier 1 (dramatic)  — headings: scale+blur+rotation                */
/*  Tier 2 (medium)    — cards/widgets: slide-up with slight bounce   */
/*  Tier 3 (subtle)    — body text/labels: gentle fade-up             */
/*  Tier 4 (micro)     — icons/badges: scale pulse                    */
/* ------------------------------------------------------------------ */

const tierConfig = {
  '1': { from: { y: 40, opacity: 0, scale: 0.88, filter: 'blur(7px)', rotation: -2 }, duration: 0.72, ease: 'power4.out' },
  '2': { from: { y: 28, opacity: 0, scale: 0.97 }, duration: 0.52, ease: 'back.out(1.15)' },
  '3': { from: { y: 14, opacity: 0 }, duration: 0.38, ease: 'power2.out' },
  '4': { from: { y: 0, opacity: 0, scale: 0.88 }, duration: 0.28, ease: 'power2.out' },
}

export function useReveal(deps: unknown[] = []) {
  const ref = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced || !ref.current) return

    const ctx = gsap.context(() => {
      /* Tier-specific reveals */
      for (const [tier, cfg] of Object.entries(tierConfig)) {
        const els = ref.current!.querySelectorAll(`[data-reveal-tier="${tier}"]`)
        if (!els.length) continue
        gsap.fromTo(els, { ...cfg.from }, {
          y: 0, opacity: 1, scale: 1, filter: 'blur(0px)', rotation: 0,
          duration: cfg.duration,
          stagger: tier === '1' ? 0.1 : tier === '2' ? 0.08 : 0.05,
          ease: cfg.ease,
          clearProps: 'filter,scale,rotation',
        })
      }

      /* Fallback: legacy data-reveal without tier */
      const legacy = ref.current!.querySelectorAll('[data-reveal]:not([data-reveal-tier])')
      if (legacy.length) {
        gsap.fromTo(legacy, { y: 18, opacity: 0, filter: 'blur(4px)' }, {
          y: 0, opacity: 1, filter: 'blur(0px)',
          duration: 0.54, stagger: 0.065, ease: 'power3.out', clearProps: 'filter',
        })
      }
    }, ref)

    return () => ctx.revert()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return ref
}

/* ------------------------------------------------------------------ */
/*  Page Transition Helper                                            */
/*  Wraps route content in a fade-slide transition                    */
/* ------------------------------------------------------------------ */

export function usePageTransition() {
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced || !ref.current) return

    const ctx = gsap.context(() => {
      gsap.fromTo(ref.current, { opacity: 0, y: 8 }, {
        opacity: 1, y: 0, duration: 0.32, ease: 'power2.out',
      })
    }, ref)
    return () => ctx.revert()
  }, [])

  return ref
}

/* ------------------------------------------------------------------ */
/*  GSAP Counter Animation                                            */
/* ------------------------------------------------------------------ */

export function useCounter(targetValue: number, duration = 1.2) {
  const ref = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced || !ref.current) return

    const obj = { val: 0 }
    const el = ref.current
    gsap.to(obj, {
      val: targetValue,
      duration,
      ease: 'power2.out',
      delay: 0.3,
      onUpdate: () => { el.textContent = Math.round(obj.val).toString() },
    })
  }, [targetValue, duration])

  return ref
}

/* ------------------------------------------------------------------ */
/*  Money formatter + Date formatter                                  */
/* ------------------------------------------------------------------ */

export const money = (value: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)

export const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

/* ------------------------------------------------------------------ */
/*  Auto-Hiding / Auto-Appearing Header Hook                          */
/* ------------------------------------------------------------------ */

export function useAutoScrollHeader() {
  const [isHidden, setIsHidden] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const location = useLocation()
  const lastScrollY = useRef(0)

  // Reset to visible on page / route changes
  useEffect(() => {
    setIsHidden(false)
    setIsScrolled(false)
    lastScrollY.current = 0
  }, [location.pathname])

  useEffect(() => {
    let ticking = false

    const handleScroll = (currentY: number) => {
      const prevY = lastScrollY.current
      const delta = currentY - prevY

      setIsScrolled(currentY > 10)

      // Always visible near top of page
      if (currentY <= 25) {
        setIsHidden(false)
        lastScrollY.current = Math.max(0, currentY)
        return
      }

      // Ignore small scroll noise
      if (Math.abs(delta) < 6) return

      if (delta > 0 && currentY > 45) {
        // Scrolling DOWN -> hide header
        setIsHidden(true)
      } else if (delta < 0) {
        // Scrolling UP -> reveal header
        setIsHidden(false)
      }

      lastScrollY.current = Math.max(0, currentY)
    }

    const onScrollCapture = (e: Event) => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const target = e.target as HTMLElement | Document | Window | null
          let currentY = 0
          if (!target || target === document || target === window) {
            currentY = window.scrollY || document.documentElement.scrollTop || 0
          } else if ('scrollTop' in target) {
            currentY = (target as HTMLElement).scrollTop || 0
          }
          handleScroll(currentY)
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', onScrollCapture, { capture: true, passive: true })
    return () => {
      window.removeEventListener('scroll', onScrollCapture, { capture: true })
    }
  }, [location.pathname])

  return { isHidden, isScrolled }
}
