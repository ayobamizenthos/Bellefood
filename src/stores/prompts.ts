import { create } from 'zustand'

interface PromptsState {
  pushPromptVisible: boolean
  setPushPromptVisible: (visible: boolean) => void
}

/** Lets the install prompt stand aside while the notifications prompt is on screen. */
export const usePrompts = create<PromptsState>(set => ({
  pushPromptVisible: false,
  setPushPromptVisible: visible => set({ pushPromptVisible: visible }),
}))
