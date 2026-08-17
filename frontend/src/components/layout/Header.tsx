import { useMemo } from 'react'
import { Link, useLocation, useMatches, useNavigate } from 'react-router-dom'
import { ArrowLeft, Bell, ChevronRight, Menu, LogOut, KeyRound } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/app/store/auth'
import { isDesktop, useUiStore } from '@/app/store/ui'
import { authApi } from '@/api/auth'
import { findNav } from '@/lib/nav'
import { cn, fmtDateTime } from '@/lib/utils'
import { Popover } from '@/components/ui/Misc'
import { Button } from '@/components/ui/Button'
import { api } from '@/api/client'
import type { Page } from '@/types/api'

export interface Crumb {
  label: string
  to?: string
}

interface Notification {
  id: number
  title: string
  message: string
  link?: string | null
  is_read: boolean
  created_at: string
}

/** Route handles may declare `handle: { crumbs: Crumb[] | (data) => Crumb[] }`. Falls back to nav config. */
function useCrumbs(): Crumb[] {
  const matches = useMatches()
  const { pathname } = useLocation()
  return useMemo(() => {
    const fromHandle = [...matches]
      .reverse()
      .map((m) => (m.handle as { crumbs?: Crumb[] } | undefined)?.crumbs)
      .find(Boolean)
    if (fromHandle) return fromHandle
    const { parent, child } = findNav(pathname)
    const crumbs: Crumb[] = []
    if (parent) crumbs.push({ label: parent.label })
    if (child) crumbs.push({ label: child.label, to: child.to })
    return crumbs
  }, [matches, pathname])
}

/**
 * Figma header: 80px white bar with shadow; left = Back pill + breadcrumb (parent #585858 16px, current #1C3586 15px);
 * right = bell with red badge + user chip (avatar 38, "Admin" 13 #797474 / name 15 #555) → logout popover.
 */
export function Header() {
  const navigate = useNavigate()
  const { toggleSidebar, setDrawerOpen, sidebarCollapsed } = useUiStore()
  const onMenu = () => (isDesktop() ? toggleSidebar() : setDrawerOpen(true))
  const crumbs = useCrumbs()
  const { user, clear, refreshToken } = useAuthStore()
  const qc = useQueryClient()

  const logout = useMutation({
    mutationFn: () => authApi.logout(refreshToken),
    onSettled: () => {
      clear()
      qc.clear()
      navigate('/login', { replace: true })
    },
  })

  const notifications = useQuery({
    queryKey: ['notifications', 'latest'],
    queryFn: () => api.get<Page<Notification>>('/notifications', { params: { page_size: 8 } }).then((r) => r.data),
    enabled: !!user,
    refetchInterval: 60_000,
    retry: false,
  })
  const unread = notifications.data?.items.filter((n) => !n.is_read).length ?? 0
  const markAll = useMutation({
    mutationFn: () => api.post('/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const initials = (user?.full_name ?? 'U')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <header className="sticky top-0 z-20 flex h-header items-center justify-between gap-3 bg-white px-3 shadow-bar sm:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenu}
          className="rounded-tag p-1.5 text-ink-cell transition-colors hover:bg-strip hover:text-primary"
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <Menu size={24} />
        </button>
        <Button variant="back" onClick={() => navigate(-1)} iconLeft={<ArrowLeft size={16} />} className="opacity-60 hover:opacity-100">
          <span className="hidden sm:inline">Back</span>
        </Button>
        <nav className="flex min-w-0 items-center gap-2 text-base" aria-label="Breadcrumb">
          {crumbs.map((c, i) => {
            const last = i === crumbs.length - 1
            return (
              <span key={i} className={cn('min-w-0 items-center gap-2', last ? 'flex' : 'hidden md:flex')}>
                {i > 0 && <ChevronRight size={16} className="hidden shrink-0 text-[#858687] md:block" />}
                {last ? (
                  <span className="truncate text-15 text-primary">{c.label}</span>
                ) : c.to ? (
                  <Link to={c.to} className="truncate text-ink-crumb hover:text-primary">
                    {c.label}
                  </Link>
                ) : (
                  <span className="truncate text-ink-crumb">{c.label}</span>
                )}
              </span>
            )
          })}
        </nav>
      </div>

      <div className="flex shrink-0 items-center gap-3 sm:gap-6">
        <Popover
          align="right"
          className="w-[min(360px,calc(100vw-1.5rem))]"
          trigger={({ toggle }) => (
            <button type="button" onClick={toggle} className="relative rounded p-1 text-ink-user hover:bg-gray-100" aria-label="Notifications">
              <Bell size={24} strokeWidth={1.8} />
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-[15px] min-w-[15px] items-center justify-center rounded-full border border-white bg-badge px-1 text-[10px] font-semibold text-white">
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </button>
          )}
        >
          {(close) => (
            <div>
              <div className="flex items-center justify-between border-b border-black/10 px-4 py-3">
                <span className="text-sm font-medium text-ink-heading">Notifications</span>
                {unread > 0 && (
                  <button type="button" className="text-xs text-primary hover:underline" onClick={() => markAll.mutate()}>
                    Mark all as read
                  </button>
                )}
              </div>
              <ul className="max-h-[360px] overflow-y-auto">
                {(notifications.data?.items ?? []).length === 0 && (
                  <li className="px-4 py-6 text-center text-sm text-ink-muted">No notifications</li>
                )}
                {notifications.data?.items.map((n) => (
                  <li key={n.id} className={cn('border-b border-black/5 px-4 py-3 last:border-b-0', !n.is_read && 'bg-zebra')}>
                    <button
                      type="button"
                      className="w-full text-left"
                      onClick={() => {
                        api.patch(`/notifications/${n.id}/read`).finally(() => qc.invalidateQueries({ queryKey: ['notifications'] }))
                        close()
                        if (n.link) navigate(n.link)
                      }}
                    >
                      <div className="text-sm font-medium text-ink-heading">{n.title}</div>
                      <div className="mt-0.5 line-clamp-2 text-xs text-ink-cell">{n.message}</div>
                      <div className="mt-1 text-[11px] text-ink-muted">{fmtDateTime(n.created_at)}</div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Popover>

        <Popover
          align="right"
          className="w-[237px] rounded-card bg-[#F5F5F5] p-0"
          trigger={({ toggle }) => (
            <button type="button" onClick={toggle} className="flex items-center gap-2 rounded-input py-1 pl-[15px] pr-2 hover:bg-gray-100">
              <Avatar initials={initials} size={38} />
              <span className="hidden text-left leading-tight sm:block">
                <span className="block text-13 font-medium text-ink-role">{user?.role?.name ?? roleLabel(user?.user_type)}</span>
                <span className="block text-15 font-medium text-ink-user">{user?.full_name}</span>
              </span>
            </button>
          )}
        >
          {(close) => (
            <div className="flex flex-col items-center gap-4 py-7">
              <Avatar initials={initials} size={60} />
              <div className="text-center">
                <div className="text-xl font-medium tracking-[1.6px] text-primary-alt">{user?.role?.name ?? roleLabel(user?.user_type)}</div>
                <div className="mt-1 text-sm text-ink-user">{user?.full_name}</div>
                <div className="text-xs text-ink-muted">{user?.email ?? user?.username}</div>
              </div>
              <Link
                to="/change-password"
                onClick={close}
                className="inline-flex items-center gap-2 text-sm text-ink-cell hover:text-primary"
              >
                <KeyRound size={16} /> Change password
              </Link>
              <Button variant="primary" size="sm" className="h-9 px-6" iconLeft={<LogOut size={16} />} onClick={() => logout.mutate()} loading={logout.isPending}>
                Log Out
              </Button>
            </div>
          )}
        </Popover>
      </div>
    </header>
  )
}

function roleLabel(t?: string) {
  switch (t) {
    case 'super_admin':
      return 'Super Admin'
    case 'admin':
      return 'Admin'
    case 'office_user':
      return 'Office User'
    case 'ship_base_user':
      return 'Ship/Base User'
    default:
      return 'User'
  }
}

export function Avatar({ initials, size = 38, src }: { initials: string; size?: number; src?: string | null }) {
  return src ? (
    <img src={src} alt="" className="rounded-full object-cover" style={{ width: size, height: size }} />
  ) : (
    <span
      className="inline-flex items-center justify-center rounded-full bg-primary/10 font-medium text-primary"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials}
    </span>
  )
}
