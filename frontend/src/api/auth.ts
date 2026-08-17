import { api } from './client'
import type { TokenPair, UserMe } from '@/types/api'

export const authApi = {
  login: (identifier: string, password: string, remember_me: boolean) =>
    api.post<TokenPair>('/auth/login', { identifier, password, remember_me }).then((r) => r.data),
  me: () => api.get<UserMe>('/auth/me').then((r) => r.data),
  logout: (refresh_token: string | null) => api.post('/auth/logout', { refresh_token }).then((r) => r.data),
  forgotPassword: (identifier: string) => api.post('/auth/forgot-password', { identifier }).then((r) => r.data),
  resetPassword: (token: string, new_password: string) =>
    api.post('/auth/reset-password', { token, new_password }).then((r) => r.data),
  changePassword: (current_password: string, new_password: string) =>
    api.post('/auth/change-password', { current_password, new_password }).then((r) => r.data),
}
