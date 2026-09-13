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

function dedupeReports(reports: LotAssessment[]): LotAssessment[] {
  const seen = new Set<string>()
  const result: LotAssessment[] = []
  for (const r of reports) {
    if (r && r.id && !seen.has(r.id)) {
      seen.add(r.id)
      result.push(r)
    }
  }
  return result
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      reports: dedupeReports(seededReports()),
      profile: '',
      toast: null,

      addReport: (report) =>
        set((state) => {
          const item = { ...report, isGuest: !state.profile }
          const existingIndex = state.reports.findIndex((r) => r.id === report.id)
          if (existingIndex >= 0) {
            const next = [...state.reports]
            next[existingIndex] = item
            return { reports: dedupeReports(next) }
          }
          return { reports: dedupeReports([item, ...state.reports]) }
        }),
      setProfile: (name) =>
        set((state) => ({
          profile: name,
          reports: state.reports.map((r) => ({ ...r, isGuest: false })),
        })),
      logout: () => set({ profile: '' }),
      notify: (message, kind = 'success') => {
        set({ toast: { message, kind } })
        setTimeout(() => set({ toast: null }), 3200)
      },
      clearReports: () => set({ reports: dedupeReports(seededReports()) }),
    }),
    {
      name: 'oniongrade-storage',
      partialize: (state) => ({ reports: state.reports, profile: state.profile }),
      merge: (persistedState: any, currentState: AppState): AppState => {
        const rawReports = Array.isArray(persistedState?.reports)
          ? (persistedState.reports as LotAssessment[])
          : currentState.reports
        return {
          ...currentState,
          ...persistedState,
          reports: dedupeReports(rawReports),
        }
      },
    }
  )
)
