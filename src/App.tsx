import { useState, useEffect } from 'react'
import { Link, NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import {
  SquaresFour, Camera, FileText, ChartLineUp,
  GearSix, Bell, MagnifyingGlass, SignOut,
  Plus, CaretDown, Sparkle, Check, Medal, Globe
} from '@phosphor-icons/react'
import { Brand } from './components/Brand'
import { usePageTransition, useAutoScrollHeader } from './hooks/useAnimations'
import { useStore } from './store'

/* Pages */
import { Welcome } from './pages/Welcome'
import { Login } from './pages/Login'
import { ProfileSetup } from './pages/ProfileSetup'
import { Dashboard } from './pages/Dashboard'
import { Assessment } from './pages/Assessment'
import { Capture } from './pages/Capture'
import { Analyzing } from './pages/Analyzing'
import { Reports } from './pages/Reports'
import { ReportDetail } from './pages/ReportDetail'
import { Market } from './pages/Market'
import { Settings as SettingsPage } from './pages/Settings'
import { DealerVerify } from './pages/DealerVerify'
import { Leaderboard } from './pages/Leaderboard'
import { FloatingOrb } from './components/FloatingOrb'

function App() {
  const profile = useStore(state => state.profile)
  const toast = useStore(state => state.toast)

  return (
    <>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/setup" element={<ProfileSetup />} />
        <Route path="/dealer/:code?" element={<DealerVerify />} />
        <Route path="/*" element={<AppShell />} />
      </Routes>
      {toast && (
        <div className={`toast ${toast.kind === 'plain' ? 'toast-plain' : ''}`}>
          <Check size={17} weight="bold" />{toast.message}
        </div>
      )}
    </>
  )
}

/* ------------------------------------------------------------------ */
/*  App Shell — sidebar + top bar + route outlet                      */
/* ------------------------------------------------------------------ */

function AppShell() {
  const location = useLocation()
  const pageRef = usePageTransition()
  const { isHidden, isScrolled } = useAutoScrollHeader()
  
  const profile = useStore(state => state.profile)
  const reportsCount = useStore(state => state.reports.length)
  const logout = useStore(state => state.logout)

  const nav = [
    { to: '/dashboard', icon: SquaresFour, label: 'Overview' },
    { to: '/assessment', icon: Camera, label: 'Assess lot' },
    { to: '/reports', icon: FileText, label: 'Reports' },
    { to: '/market', icon: ChartLineUp, label: 'Market rates' },
    { to: '/leaderboard', icon: Medal, label: 'Leaderboard' },
  ]

  const mobileNav = [
    nav[0],
    nav[2],
    { ...nav[4], label: 'Leaders' }, // Shortened for mobile
    { to: '/settings', icon: GearSix, label: 'Settings' },
  ]

  const crumb = location.pathname.includes('assessment')
    ? 'New assessment'
    : location.pathname.includes('reports')
      ? 'Quality reports'
      : `Good morning, ${profile ? profile.split(' ')[0] : 'Guest'}`

  return (
    <div className="app-shell">
      {/* Desktop sidebar — UNTOUCHED per user request */}
      <aside className="sidebar">
        <Brand light />
        <div className="profile-mini">
          <span className="avatar">{profile ? profile.substring(0, 2).toUpperCase() : 'G'}</span>
          <div>
            <b>{profile || 'Guest User'}</b>
            <small>{profile ? 'Farmer account' : 'Guest session'}</small>
          </div>
          <CaretDown size={15} />
        </div>
        <nav>
          {nav.map(item => (
            <NavLink key={item.to} to={item.to} end={item.to === '/dashboard'}>
              <item.icon size={18} weight="regular" />
              <span>{item.label}</span>
              {item.to === '/reports' && <i>{reportsCount}</i>}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <Link to="/settings">
            <GearSix size={18} /> Settings
          </Link>
          {profile ? (
            <button onClick={logout}>
              <SignOut size={18} /> Sign out
            </button>
          ) : (
            <Link to="/login" style={{ display: 'flex', alignItems: 'center', gap: '11px', background: 'transparent', border: 'none', color: '#c8c8cc', fontSize: '14px', fontWeight: 600, padding: '0 12px', minHeight: '44px', width: '100%' }}>
              <SignOut size={18} style={{ transform: 'scaleX(-1)' }} /> Login
            </Link>
          )}
          <div className="pro-card">
            <Sparkle size={18} weight="fill" />
            <b>Fair deals start with proof.</b>
            <p>Every scan is securely time-stamped and shareable.</p>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <main className="app-main" ref={pageRef} key={location.pathname}>
        <header className={`topbar ${isHidden ? 'topbar-hidden' : ''} ${isScrolled ? 'topbar-scrolled' : ''}`}>
          <div className="crumb">{crumb}</div>
          <div className="top-actions">
            <LanguageSelector />
            <button className="icon-button">
              <MagnifyingGlass size={19} />
            </button>
            <button className="icon-button notification">
              <Bell size={19} />
              <i />
            </button>
            <span className="avatar">AP</span>
          </div>
        </header>

        <Routes>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="assessment" element={<Assessment />} />
          <Route path="capture" element={<Capture />} />
          <Route path="analyzing" element={<Analyzing />} />
          <Route path="reports" element={<Reports />} />
          <Route path="reports/:id" element={<ReportDetail />} />
          <Route path="market" element={<Market />} />
          <Route path="leaderboard" element={<Leaderboard />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Routes>
      </main>

      {/* iOS 26 liquid glass tab bar — mobile only */}
      <nav className="mobile-nav">
        {mobileNav.slice(0, 2).map(item => (
          <NavLink key={item.to} to={item.to} end={item.to === '/dashboard'}>
            <item.icon size={20} weight="regular" />
            <span>{item.label}</span>
          </NavLink>
        ))}
        <NavLink className="mobile-create" to="/assessment">
          <Plus size={22} weight="bold" />
          <span>Assess</span>
        </NavLink>
        {mobileNav.slice(2).map(item => (
          <NavLink key={item.to} to={item.to}>
            <item.icon size={20} weight="regular" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <FloatingOrb />
    </div>
  )
}

export default App

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'हिन्दी' },
  { code: 'mr', name: 'मराठी' },
  { code: 'bn', name: 'বাংলা' },
  { code: 'te', name: 'తెలుగు' },
  { code: 'ta', name: 'தமிழ்' },
  { code: 'gu', name: 'ગુજરાતી' },
  { code: 'kn', name: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'മലയാളം' },
  { code: 'pa', name: 'ਪੰਜਾਬੀ' },
  { code: 'or', name: 'ଓଡ଼ିଆ' },
  { code: 'ur', name: 'اردو' }
]

function LanguageSelector() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentLang, setCurrentLang] = useState('en')

  useEffect(() => {
    // Add the google translate script if not already present
    if (!document.querySelector('script[src*="translate.google.com"]')) {
      const addScript = document.createElement('script');
      addScript.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      document.body.appendChild(addScript);
      
      (window as any).googleTranslateElementInit = () => {
        new (window as any).google.translate.TranslateElement({
          pageLanguage: 'en',
          includedLanguages: 'en,hi,mr,bn,te,ta,gu,kn,ml,pa,or,ur',
          autoDisplay: false
        }, 'google_translate_element');
      };
    }
    
    // Check if there is an existing language cookie
    const match = document.cookie.match(/googtrans=\/en\/([a-z]{2})/)
    if (match) {
      setCurrentLang(match[1])
    }
  }, [])

  const changeLanguage = (langCode: string) => {
    setIsOpen(false);
    if (langCode === currentLang) return;
    setCurrentLang(langCode);
    
    // Set cookie for google translate
    if (langCode === 'en') {
      document.cookie = "googtrans=/en/en; path=/";
      document.cookie = "googtrans=/en/en; domain=" + window.location.hostname + "; path=/";
    } else {
      document.cookie = `googtrans=/en/${langCode}; path=/`;
      document.cookie = `googtrans=/en/${langCode}; domain=` + window.location.hostname + `; path=/`;
    }
    window.location.reload();
  }

  return (
    <div style={{ position: 'relative' }}>
      <div id="google_translate_element" style={{ display: 'none' }}></div>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: 'var(--lime)', color: '#202124',
          border: 'none', borderRadius: '12px', padding: '0 12px',
          height: '36px', fontSize: '13px', fontWeight: 700,
          cursor: 'pointer', boxShadow: '0 2px 8px rgba(217, 249, 90, 0.2)'
        }}
      >
        <Globe size={18} weight="bold" />
        {currentLang.toUpperCase()}
        <CaretDown size={14} weight="bold" />
      </button>
      
      {isOpen && (
        <>
          <div 
            style={{ position: 'fixed', inset: 0, zIndex: 90 }} 
            onClick={() => setIsOpen(false)}
          />
          <div style={{
            position: 'absolute', top: '100%', right: 0, marginTop: '8px',
            background: '#fff', borderRadius: '12px', width: '140px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)', overflow: 'hidden', zIndex: 100,
            border: '1px solid #eee', display: 'flex', flexDirection: 'column'
          }}>
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                style={{
                  display: 'flex', width: '100%', textAlign: 'left',
                  padding: '10px 14px', background: lang.code === currentLang ? '#f0f8cb' : '#fff',
                  border: 'none', fontSize: '13px', color: '#202124', fontWeight: lang.code === currentLang ? 700 : 500,
                  cursor: 'pointer', outline: 'none'
                }}
                onMouseOver={e => e.currentTarget.style.background = lang.code === currentLang ? '#f0f8cb' : '#f9f9f9'}
                onMouseOut={e => e.currentTarget.style.background = lang.code === currentLang ? '#f0f8cb' : '#fff'}
              >
                {lang.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
