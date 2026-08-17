import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/app/store/auth'
import type { ModuleCode, PermissionAction } from '@/types/api'

export function RequireAuth() {
  const user = useAuthStore((s) => s.user)
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}

export function RequireGuest() {
  const user = useAuthStore((s) => s.user)
  if (user) return <Navigate to="/" replace />
  return <Outlet />
}

/** Wrap a page: renders 403 view if the user lacks `module.action` (default action: list). */
export function RequirePermission({
  module,
  action = 'list',
  children,
}: {
  module: ModuleCode
  action?: PermissionAction
  children: React.ReactNode
}) {
  const ok = useAuthStore((s) => s.hasPermission(module, action))
  if (!ok) return <Forbidden />
  return <>{children}</>
}

export function Forbidden() {
  return (
    <div className="card mx-auto mt-10 max-w-lg p-10 text-center">
      <div className="text-5xl font-medium text-primary">403</div>
      <p className="mt-3 text-ink-cell">You do not have permission to access this page.</p>
      <p className="mt-1 text-sm text-ink-muted">Contact your administrator if you believe this is a mistake.</p>
    </div>
  )
}
