import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface PreferencesState {
  alertsEnabled: boolean
  setAlerts: (enabled: boolean) => void
}

export const usePreferences = create<PreferencesState>()(
  persist(
    set => ({
      alertsEnabled: true,
      setAlerts: enabled => set({ alertsEnabled: enabled }),
    }),
    { name: 'bellefood-preferences', skipHydration: true }
  )
)
