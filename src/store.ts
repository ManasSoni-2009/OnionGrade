import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { seededReports } from './data'
import type { LotAssessment } from './types'

type ToastMessage = { message: string; kind?: 'success' | 'plain' } | null

interface AppState {
  reports: LotAssessment[]
  profile: string
  toast: ToastMessage
  
  // Actions
  addReport: (report: LotAssessment) => void
  setProfile: (name: string) => void
  logout: () => void
  notify: (message: string, kind?: 'success' | 'plain') => void
  clearReports: () => void
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      reports: seededReports(),
      profile: '',
      toast: null,

      addReport: (report) => set((state) => ({ reports: [{ ...report, isGuest: !state.profile }, ...state.reports] })),
      setProfile: (name) => set((state) => ({
        profile: name,
        reports: state.reports.map(r => ({ ...r, isGuest: false }))
      })),
      logout: () => set({ profile: '' }),
      notify: (message, kind = 'success') => {
        set({ toast: { message, kind } })
        setTimeout(() => set({ toast: null }), 3200)
      },
      clearReports: () => set({ reports: seededReports() })
    }),
    {
      name: 'oniongrade-storage',
      partialize: (state) => ({ reports: state.reports, profile: state.profile }), // Only persist reports and profile
    }
  )
)
