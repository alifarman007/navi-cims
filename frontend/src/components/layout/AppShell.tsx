import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

/**
 * Figma shell: fixed 325px sidebar, 80px header, 40px footer, body bg tint, content column
 * max 1546px inset 24px (fluid below 1920).
 */
export function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <div className="min-h-screen bg-page">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="flex min-h-screen flex-col xl:pl-sidebar">
        <Header onMenu={() => setMenuOpen(true)} />
        <main className="flex-1 px-6 py-6">
          <div className="mx-auto w-full max-w-content">
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
      <span>
        Copyright ©{new Date().getFullYear()} <span className="text-[#4D4C4C]">CIMS</span>. Design and Developed by{' '}
        <span className="text-footerBrand">TotalOfftec.</span>&nbsp; All rights reserved.
      </span>
    </footer>
  )
}
