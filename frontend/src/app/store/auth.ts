import { create } from 'zustand'
import type { ModuleCode, PermissionAction, TokenPair, UserMe } from '@/types/api'

const ACCESS_KEY = 'cims.access'
const REFRESH_KEY = 'cims.refresh'
const REMEMBER_KEY = 'cims.remember'

/** "Remember me" → localStorage (survives browser restart), otherwise sessionStorage. */
function storage(): Storage {
  return localStorage.getItem(REMEMBER_KEY) === '1' ? localStorage : sessionStorage
}

function readToken(key: string): string | null {
  return localStorage.getItem(key) ?? sessionStorage.getItem(key)
}

interface AuthState {
  user: UserMe | null
  accessToken: string | null
  refreshToken: string | null
  hydrated: boolean
  setSession: (pair: TokenPair, remember?: boolean) => void
  setUser: (user: UserMe) => void
  setTokens: (access: string, refresh: string) => void
  clear: () => void
  hasPermission: (module: ModuleCode, action: PermissionAction) => boolean
  canMenu: (module: ModuleCode) => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: readToken(ACCESS_KEY),
  refreshToken: readToken(REFRESH_KEY),
  hydrated: false,

  setSession: (pair, remember) => {
    if (remember !== undefined) {
      if (remember) localStorage.setItem(REMEMBER_KEY, '1')
      else localStorage.removeItem(REMEMBER_KEY)
    }
    // clear both storages before writing to the chosen one
    for (const s of [localStorage, sessionStorage]) {
      s.removeItem(ACCESS_KEY)
      s.removeItem(REFRESH_KEY)
    }
    const s = storage()
    s.setItem(ACCESS_KEY, pair.access_token)
    s.setItem(REFRESH_KEY, pair.refresh_token)
    set({ user: pair.user, accessToken: pair.access_token, refreshToken: pair.refresh_token, hydrated: true })
  },

  setUser: (user) => set({ user, hydrated: true }),

  setTokens: (access, refresh) => {
    const s = storage()
    s.setItem(ACCESS_KEY, access)
    s.setItem(REFRESH_KEY, refresh)
    set({ accessToken: access, refreshToken: refresh })
  },

  clear: () => {
    for (const s of [localStorage, sessionStorage]) {
      s.removeItem(ACCESS_KEY)
      s.removeItem(REFRESH_KEY)
    }
    set({ user: null, accessToken: null, refreshToken: null, hydrated: true })
  },

  hasPermission: (module, action) => {
    const u = get().user
    if (!u) return false
    if (u.is_superuser || u.user_type === 'super_admin') return true
    return Boolean(u.permissions?.[module]?.[action])
  },

  canMenu: (module) => get().hasPermission(module, 'menu'),
}))
