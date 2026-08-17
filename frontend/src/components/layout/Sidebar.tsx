import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ChevronRight, ChevronDown } from 'lucide-react'
import crest from '@/assets/navy-crest.png'
import { NAV, type NavItem } from '@/lib/nav'
import { useAuthStore } from '@/app/store/auth'
import { cn } from '@/lib/utils'

/**
 * Figma sidebar: 325px, bg #002652 + 30% black overlay, logo block h107 (crest 69×65 + brand text Poppins),
 * parent items h40 r6 Roboto 17 #DEDEDE with chevron; expanded parent bg rgba(255,255,255,.08) text #F9FCFF;
 * submenu items 15px with a 3×20 left pill (white 60% / orange #ED841A active) and active bg rgba(0,48,102,.75).
 */
export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { pathname } = useLocation()
  const canMenu = useAuthStore((s) => s.canMenu)
  const items = NAV.filter((n) => canMenu(n.module))

  const activeParent = items.find((n) => n.children?.some((c) => pathname === c.to || pathname.startsWith(c.to + '/')))
  const [expanded, setExpanded] = useState<string | null>(activeParent?.label ?? null)
  useEffect(() => {
    if (activeParent) setExpanded(activeParent.label)
  }, [activeParent?.label]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {/* mobile backdrop */}
      {open && <div className="fixed inset-0 z-30 bg-black/40 xl:hidden" onClick={onClose} />}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-[280px] flex-col 2xl:w-sidebar bg-sidebar-base text-sidebar-text transition-transform duration-200 xl:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
        style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3))' }}
      >
        <div className="flex h-[107px] shrink-0 items-center gap-3 px-4 2xl:px-5">
          <img src={crest} alt="Bangladesh Navy" className="h-[65px] w-[69px] object-contain" />
          <div className="font-brand leading-tight text-white">
            <div className="text-[18px] font-semibold 2xl:text-xl">Central Inventory</div>
            <div className="text-[15px] font-medium 2xl:text-base">Management System</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-6 pt-[10px] 2xl:px-[15px]">
          <ul className="flex flex-col gap-1">
            {items.map((item) => (
              <SidebarItem
                key={item.label}
                item={item}
                expanded={expanded === item.label}
                onToggle={() => setExpanded((e) => (e === item.label ? null : item.label))}
                pathname={pathname}
                onNavigate={onClose}
              />
            ))}
          </ul>
        </nav>
      </aside>
    </>
  )
}

function SidebarItem({
  item,
  expanded,
  onToggle,
  pathname,
  onNavigate,
}: {
  item: NavItem
  expanded: boolean
  onToggle: () => void
  pathname: string
  onNavigate: () => void
}) {
  const Icon = item.icon
  if (item.to && !item.children) {
    const active = pathname === item.to
    return (
      <li>
        <NavLink
          to={item.to}
          onClick={onNavigate}
          className={cn(
            'flex h-10 items-center gap-2.5 rounded-tag px-3 text-[15px] capitalize tracking-[0.15px] transition-colors hover:bg-sidebar-hoverBg 2xl:gap-3 2xl:px-[15px] 2xl:text-17 2xl:tracking-[0.17px]',
            active && 'bg-sidebar-openBg text-sidebar-active',
          )}
        >
          <Icon size={18} className={cn('shrink-0', active ? 'opacity-100' : 'opacity-75')} />
          <span className="truncate">{item.label}</span>
        </NavLink>
      </li>
    )
  }
  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'flex h-10 w-full items-center gap-2.5 rounded-tag px-3 text-[15px] capitalize tracking-[0.15px] transition-colors hover:bg-sidebar-hoverBg 2xl:gap-3 2xl:px-[15px] 2xl:text-17 2xl:tracking-[0.17px]',
          expanded && 'bg-sidebar-openBg text-sidebar-active',
        )}
        aria-expanded={expanded}
      >
        <Icon size={18} className={cn('shrink-0', expanded ? 'opacity-100' : 'opacity-75')} />
        <span className="flex-1 truncate text-left">{item.label}</span>
        {expanded ? <ChevronDown size={20} className="shrink-0 text-[#D2C3C3]" /> : <ChevronRight size={20} className="shrink-0" />}
      </button>
      {expanded && item.children && (
        <ul className="mt-2.5 flex flex-col gap-1 pl-2 2xl:pl-[15px]">
          {item.children.map((c) => {
            const active = pathname === c.to || pathname.startsWith(c.to + '/')
            return (
              <li key={c.to}>
                <NavLink
                  to={c.to}
                  onClick={onNavigate}
                  className={cn(
                    'group flex h-10 items-center gap-3 rounded-tag pl-4 pr-3 text-[14px] capitalize tracking-[0.14px] transition-colors hover:bg-sidebar-hoverBg 2xl:gap-4 2xl:pl-5 2xl:pr-[15px] 2xl:text-15',
                    active && 'bg-sidebar-subActiveBg text-white',
                  )}
                >
                  <span
                    className={cn(
                      'h-5 w-[3px] shrink-0 rounded-full',
                      active ? 'bg-accent' : 'bg-white/60 group-hover:bg-accent/60',
                    )}
                  />
                  <span className="truncate">{c.label}</span>
                </NavLink>
              </li>
            )
          })}
        </ul>
      )}
    </li>
  )
}
