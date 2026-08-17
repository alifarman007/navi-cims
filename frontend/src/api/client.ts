import axios, { AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/app/store/auth'
import type { TokenPair } from '@/types/api'

export const API_URL = import.meta.env.VITE_API_URL || '/api/v1'

export const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  // repeatable params: filter=a:b&filter=c:d (no [] suffix)
  paramsSerializer: { indexes: null },
})

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let refreshing: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken, setTokens, setUser, clear } = useAuthStore.getState()
  if (!refreshToken) return null
  try {
    const { data } = await axios.post<TokenPair>(`${API_URL}/auth/refresh`, { refresh_token: refreshToken })
    setTokens(data.access_token, data.refresh_token)
    setUser(data.user)
    return data.access_token
  } catch {
    clear()
    return null
  }
}

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined
    const status = error.response?.status
    const url = original?.url ?? ''
    if (status === 401 && original && !original._retry && !url.includes('/auth/login') && !url.includes('/auth/refresh')) {
      original._retry = true
      refreshing ??= refreshAccessToken().finally(() => {
        refreshing = null
      })
      const token = await refreshing
      if (token) {
        original.headers = { ...(original.headers ?? {}), Authorization: `Bearer ${token}` }
        return api.request(original)
      }
      // hard logout → login page (keep it simple; router listens to store)
      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login')
      }
    }
    return Promise.reject(error)
  },
)

/** Download helper for xlsx exports. */
export async function apiDownload(url: string, params?: Record<string, unknown>): Promise<Blob> {
  const { data } = await api.get(url, { params, responseType: 'blob' })
  return data as Blob
}
