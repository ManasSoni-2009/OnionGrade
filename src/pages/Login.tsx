import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Phone, ArrowRight, ArrowLeft } from '@phosphor-icons/react'
import { Brand } from '../components/Brand'
import { useReveal } from '../hooks/useAnimations'

import { useStore } from '../store'

export function Login() {
  const setProfile = useStore(state => state.setProfile)
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const otpRefs = useRef<Array<HTMLInputElement | null>>([])
  const navigate = useNavigate()
  const ref = useReveal([step])

  const proceed = () => {
    if (step === 'phone') {
      setStep('otp')
    } else {
      setProfile('Arjun Patil')
      navigate('/setup')
    }
  }

  const updateOtp = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    setOtp(current => current.map((item, position) => (position === index ? digit : item)))
    if (digit && index < 5) {
      window.requestAnimationFrame(() => otpRefs.current[index + 1]?.focus())
    }
  }

  const pasteOtp = (event: React.ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault()
    const digits = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6).split('')
    if (!digits.length) return
    setOtp(Array.from({ length: 6 }, (_, index) => digits[index] || ''))
    window.requestAnimationFrame(() => otpRefs.current[Math.min(digits.length, 5)]?.focus())
  }

  return (
    <main className="auth-page" ref={ref}>
      <Link className="back-link" to="/" data-reveal-tier="4">
        <ArrowLeft size={17} weight="regular" /> Back
      </Link>

      <div className="auth-card" data-reveal data-reveal-tier="2">
        <Brand />

        <div className="auth-icon" data-reveal-tier="4">
          <Phone size={26} weight="fill" />
        </div>

        <div className="eyebrow" data-reveal-tier="3">
          Secure sign in
        </div>

        <h1 data-reveal-tier="1">
          {step === 'phone' ? 'Your harvest starts here.' : 'Enter your secure code.'}
        </h1>

        <p data-reveal-tier="3">
          {step === 'phone'
            ? 'We’ll send a one-time verification code to your mobile number.'
            : 'We’ve sent a 6-digit demo code to +91 98765 43210.'}
        </p>

        {step === 'phone' ? (
          <label className="field" data-reveal-tier="3">
            <span>Mobile number</span>
            <div className="phone-input">
              <b>+91</b>
              <input autoFocus defaultValue="98765 43210" aria-label="Mobile number" />
            </div>
          </label>
        ) : (
          <div className="otp-inputs" onPaste={pasteOtp} data-reveal-tier="3">
            {otp.map((value, index) => (
              <input
                key={index}
                ref={element => {
                  otpRefs.current[index] = element
                }}
                value={value}
                maxLength={1}
                inputMode="numeric"
                autoComplete={index === 0 ? 'one-time-code' : 'off'}
                className={value ? 'filled' : ''}
                onChange={event => updateOtp(index, event.target.value)}
                onKeyDown={event => {
                  if (event.key === 'Backspace' && !value && index > 0) {
                    otpRefs.current[index - 1]?.focus()
                  }
                }}
                aria-label={`Digit ${index + 1} of 6`}
              />
            ))}
          </div>
        )}

        <button
          type="button"
          className="button button-primary button-full"
          onClick={proceed}
          data-reveal-tier="3"
        >
          {step === 'phone' ? 'Send code' : 'Verify & continue'}
          <ArrowRight size={18} weight="regular" />
        </button>

        {step === 'otp' && (
          <button
            type="button"
            className="text-button"
            onClick={() => setStep('phone')}
            data-reveal-tier="4"
          >
            Use a different number
          </button>
        )}

        <small data-reveal-tier="4">This is a frontend demo. No SMS is sent.</small>
      </div>
    </main>
  )
}
