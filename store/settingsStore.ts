import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppSettings } from '@/types'

const DEFAULT_SETTINGS: AppSettings = {
  autoNext: true,
  autoNextDelaySec: 1,
  soundEnabled: false,
  vibrationEnabled: true,
  showExplanation: true,
  theme: 'dark',
  fontSize: 'md',
  speedModeAutoSec: 3,
}

interface SettingsState extends AppSettings {
  update: (partial: Partial<AppSettings>) => void
  reset: () => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,

      update(partial) {
        set(partial)
      },

      reset() {
        set(DEFAULT_SETTINGS)
      },
    }),
    {
      name: 'quiz-settings',
    },
  ),
)
