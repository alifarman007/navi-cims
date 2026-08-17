import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ChevronRight, ChevronDown, X } from 'lucide-react'
import crest from '@/assets/navy-crest.png'
import { NAV, type NavItem, type NavChild } from '@/lib/nav'
import { useAuthStore } from '@/app/store/auth'
import { useUiStore } from '@/app/store/ui'
import { cn } from '@/lib/utils'

/**
 * Figma sidebar: 325px, bg #002652 + 30% black overlay, logo block h107 (crest 69×65 + brand text Poppins),
 * parent items h40 r6 Roboto 17 #DEDEDE with chevron; expanded parent bg rgba(255,255,255,.08) text #F9FCFF;
 * submenu items 15px with a 3×20 left pill (white 60% / orange #ED841A active) and active bg rgba(0,48,102,.75).
 *
 * Three modes:
 *  - desktop expanded (≥1280px): 280px (325px at ≥1536px)
 *  - desktop collapsed: 76px icon rail; hovering an icon shows a flyout with the sub-menu
 *  - below 1280px: off-canvas drawer (always expanded content)
 * Width / transform are animated; the state is persisted (ui store).
 */
export const SIDEBAR_RAIL = 76

export function Sidebar() {
  const { pathname } = useLocation()
  const canMenu = useAuthStore((s) => s.canMenu)
  const { sidebarCollapsed: collapsed, drawerOpen, setDrawerOpen, setSidebarCollapsed } = useUiStore()
  const items = NAV.filter((n) => canMenu(n.module))

  const activeParent = items.find((n) => n.children?.some((c) => pathname === c.to || pathname.startsWith(c.to + '/')))
  const [expanded, setExpanded] = useState<string | null>(activeParent?.label ?? null)
  useEffect(() => {
    if (activeParent) setExpanded(activeParent.label)
  }, [activeParent?.label]) // eslint-disable-line react-hooks/exhaustive-deps

  // close the drawer on route change (mobile)
  useEffect(() => {
    setDrawerOpen(false)
  }, [pathname, setDrawerOpen])

  // warm the page chunks the user can reach, in idle time → navigation feels instant
  useEffect(() => {
    const loaders = items.flatMap((n) => [n.preload, ...(n.children ?? []).map((c) => c.preload)]).filter(Boolean) as (() => Promise<unknown>)[]
    let i = 0
    let handle: number | undefined
    const idle: (cb: () => void) => number =
      'requestIdleCallback' in window ? (cb) => (window as Window & { requestIdleCallback: (cb: () => void) => number }).requestIdleCallback(cb) : (cb) => window.setTimeout(cb, 300)
    const step = () => {
      if (i >= loaders.length) return
      loaders[i++]().catch(() => undefined)
      handle = idle(step)
    }
    handle = idle(step)
    return () => {
      if (handle !== undefined && 'cancelIdleCallback' in window) (window as Window & { cancelIdleCallback: (h: number) => void }).cancelIdleCallback(handle)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length])

  const closeDrawer = () => setDrawerOpen(false)

  return (
    <>
      {/* mobile backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-30 bg-black/40 transition-opacity duration-300 xl:hidden',
          drawerOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={closeDrawer}
        aria-hidden
      />
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex flex-col bg-sidebar-base text-sidebar-text',
          'transition-[width,transform] duration-300 ease-in-out will-change-transform',
          // width: drawer (below xl) is always full; desktop toggles between rail and full
          collapsed ? 'w-[280px] xl:w-[76px]' : 'w-[280px] 2xl:w-sidebar',
          // drawer slide
          drawerOpen ? 'translate-x-0' : '-translate-x-full xl:translate-x-0',
        )}
        style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3))' }}
        aria-label="Sidebar"
      >
        {/* logo block */}
        <div className={cn('relative flex h-[107px] shrink-0 items-center gap-3 px-4 2xl:px-5', collapsed && 'xl:justify-center xl:px-0')}>
          <img src={crest} alt="Bangladesh Navy" className="h-[65px] w-[69px] shrink-0 object-contain" />
          <div className={cn('font-brand leading-tight text-white', collapsed && 'xl:hidden')}>
            <div className="text-[18px] font-semibold 2xl:text-xl">Central Inventory</div>
            <div className="text-[15px] font-medium 2xl:text-base">Management System</div>
          </div>
          <button
            type="button"
            onClick={closeDrawer}
            className="absolute right-2 top-2 rounded p-1 text-sidebar-text hover:bg-white/10 xl:hidden"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className={cn('flex-1 overflow-y-auto overflow-x-visible px-3 pb-6 pt-[10px] 2xl:px-[15px]', collapsed && 'xl:overflow-visible xl:px-2')}>
          <ul className="flex flex-col gap-1">
            {items.map((item) => (
              <SidebarItem
                key={item.label}
                item={item}
                collapsed={collapsed}
                expanded={expanded === item.label}
                onToggle={() => setExpanded((e) => (e === item.label ? null : item.label))}
                onExpandSidebar={() => {
                  setSidebarCollapsed(false)
                  setExpanded(item.label)
                }}
                pathname={pathname}
              />
            ))}
          </ul>
        </nav>
      </aside>
    </>
  )
}

function preload(x?: { preload?: () => Promise<unknown> }) {
  x?.preload?.().catch(() => undefined)
}

function SidebarItem({
  item,
  collapsed,
  expanded,
  onToggle,
  onExpandSidebar,
  pathname,
}: {
  item: NavItem
  collapsed: boolean
  expanded: boolean
  onToggle: () => void
  onExpandSidebar: () => void
  pathname: string
}) {
  const Icon = item.icon
  const isActiveGroup = !!item.children?.some((c) => pathname === c.to || pathname.startsWith(c.to + '/'))

  // ---- leaf (Dashboard)
  if (item.to && !item.children) {
    const active = pathname === item.to
    return (
      <li className="group relative">
        <NavLink
          to={item.to}
          title={item.label}
          onMouseEnter={() => preload(item)}
          onFocus={() => preload(item)}
          className={cn(
            'flex h-10 items-center gap-2.5 rounded-tag px-3 text-[15px] capitalize tracking-[0.15px] transition-colors hover:bg-sidebar-hoverBg 2xl:gap-3 2xl:px-[15px] 2xl:text-17 2xl:tracking-[0.17px]',
            active && 'bg-sidebar-openBg text-sidebar-active',
            collapsed && 'xl:justify-center xl:px-0',
          )}
        >
          <Icon size={18} className={cn('shrink-0', active ? 'opacity-100' : 'opacity-75')} />
          <span className={cn('truncate', collapsed && 'xl:hidden')}>{item.label}</span>
        </NavLink>
        {collapsed && <Flyout title={item.label} />}
      </li>
    )
  }

  // ---- group with children
  return (
    <li className="group relative">
      <button
        type="button"
        title={item.label}
        onClick={() => {
          if (collapsed && window.matchMedia('(min-width: 1280px)').matches) onExpandSidebar()
          else onToggle()
        }}
        className={cn(
          'flex h-10 w-full items-center gap-2.5 rounded-tag px-3 text-[15px] capitalize tracking-[0.15px] transition-colors hover:bg-sidebar-hoverBg 2xl:gap-3 2xl:px-[15px] 2xl:text-17 2xl:tracking-[0.17px]',
          (expanded || (collapsed && isActiveGroup)) && 'bg-sidebar-openBg text-sidebar-active',
          collapsed && 'xl:justify-center xl:px-0',
        )}
        aria-expanded={expanded}
      >
        <Icon size={18} className={cn('shrink-0', expanded || isActiveGroup ? 'opacity-100' : 'opacity-75')} />
        <span className={cn('flex-1 truncate text-left', collapsed && 'xl:hidden')}>{item.label}</span>
        <span className={cn(collapsed && 'xl:hidden')}>
          {expanded ? <ChevronDown size={20} className="shrink-0 text-[#D2C3C3]" /> : <ChevronRight size={20} className="shrink-0" />}
        </span>
      </button>

      {/* expanded sub-menu (hidden on the desktop rail) */}
      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-200 ease-out',
          expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
          collapsed && 'xl:hidden',
        )}
      >
        <ul className="min-h-0 overflow-hidden">
          <div className="mt-2.5 flex flex-col gap-1 pl-2 2xl:pl-[15px]">
            {item.children!.map((c) => (
              <SubLink key={c.to} child={c} pathname={pathname} />
            ))}
          </div>
        </ul>
      </div>

      {/* rail flyout */}
      {collapsed && (
        <Flyout title={item.label}>
          <ul className="flex flex-col gap-1 p-2">
            {item.children!.map((c) => (
              <SubLink key={c.to} child={c} pathname={pathname} flyout />
            ))}
          </ul>
        </Flyout>
      )}
    </li>
  )
}

function SubLink({ child, pathname, flyout }: { child: NavChild; pathname: string; flyout?: boolean }) {
  const active = pathname === child.to || pathname.startsWith(child.to + '/')
  return (
    <li className="list-none">
      <NavLink
        to={child.to}
        onMouseEnter={() => preload(child)}
        onFocus={() => preload(child)}
        className={cn(
          'group/link flex h-10 items-center gap-3 rounded-tag pl-4 pr-3 text-[14px] capitalize tracking-[0.14px] transition-colors hover:bg-sidebar-hoverBg',
          !flyout && '2xl:gap-4 2xl:pl-5 2xl:pr-[15px] 2xl:text-15',
          active && 'bg-sidebar-subActiveBg text-white',
        )}
      >
        <span className={cn('h-5 w-[3px] shrink-0 rounded-full', active ? 'bg-accent' : 'bg-white/60 group-hover/link:bg-accent/60')} />
        <span className="truncate">{child.label}</span>
      </NavLink>
    </li>
  )
}

/** Hover flyout used by the collapsed rail: title (+ optional sub-menu), appears to the right of the icon. */
function Flyout({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div
      className={cn(
        'pointer-events-none invisible absolute left-full top-0 z-50 hidden min-w-[220px] -translate-x-1 pl-2 opacity-0',
        'transition-all duration-150 ease-out',
        'xl:block group-hover:pointer-events-auto group-hover:visible group-hover:translate-x-0 group-hover:opacity-100',
        'group-focus-within:pointer-events-auto group-focus-within:visible group-focus-within:translate-x-0 group-focus-within:opacity-100',
      )}
    >
      <div className="overflow-hidden rounded-card bg-sidebar-base text-sidebar-text shadow-modal ring-1 ring-white/10" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3))' }}>
        <div className={cn('px-4 py-2.5 text-[15px] font-medium capitalize text-white', children && 'border-b border-white/10')}>{title}</div>
        {children}
      </div>
    </div>
  )
}
