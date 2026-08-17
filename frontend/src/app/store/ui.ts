import { create } from 'zustand'

const KEY = 'cims.sidebar.collapsed'

interface UiState {
  /** desktop (≥1280px) sidebar collapsed to the icon rail */
  sidebarCollapsed: boolean
  /** mobile/tablet off-canvas drawer open */
  drawerOpen: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (v: boolean) => void
  setDrawerOpen: (v: boolean) => void
}

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: localStorage.getItem(KEY) === '1',
  drawerOpen: false,
  toggleSidebar: () =>
    set((s) => {
      const v = !s.sidebarCollapsed
      localStorage.setItem(KEY, v ? '1' : '0')
      return { sidebarCollapsed: v }
    }),
  setSidebarCollapsed: (v) => {
    localStorage.setItem(KEY, v ? '1' : '0')
    set({ sidebarCollapsed: v })
  },
  setDrawerOpen: (v) => set({ drawerOpen: v }),
}))

/** Desktop breakpoint used by the shell (Tailwind `xl`). */
export const DESKTOP_MQ = '(min-width: 1280px)'
export const isDesktop = () => window.matchMedia(DESKTOP_MQ).matches
