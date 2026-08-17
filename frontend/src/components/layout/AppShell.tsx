import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useUiStore } from '@/app/store/ui'
import { cn } from '@/lib/utils'

/**
 * Figma shell: fixed sidebar (325px ≥1536, 280px ≥1280, collapsible to a 76px rail), 80px header,
 * 40px footer, body bg tint, content column max 1546px inset 24px (fluid below 1920).
 * The content offset animates together with the sidebar width.
 */
export function AppShell() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed)
  const { pathname } = useLocation()
  return (
    <div className="min-h-screen bg-page">
      <Sidebar />
      <div
        className={cn(
          'flex min-h-screen flex-col transition-[padding-left] duration-300 ease-in-out',
          collapsed ? 'xl:pl-[76px]' : 'xl:pl-[280px] 2xl:pl-sidebar',
        )}
      >
        <Header />
        <main className="flex-1 px-4 py-5 md:px-6 md:py-6">
          {/* keyed by pathname → subtle fade on every route change */}
          <div key={pathname} className="mx-auto w-full max-w-content animate-fade-in">
            <Outlet />
          </div>
        </main>
        <Footer />
      </div>
    </div>
  )
}

export function Footer() {
  return (
    <footer className="flex h-footer items-center justify-center bg-white px-5 text-center text-15 text-ink-light shadow-bar">
      <span className="truncate">
        Copyright ©{new Date().getFullYear()} <span className="text-[#4D4C4C]">CIMS</span>. Design and Developed by{' '}
        <span className="text-footerBrand">TotalOfftec.</span>&nbsp; All rights reserved.
      </span>
    </footer>
  )
}
