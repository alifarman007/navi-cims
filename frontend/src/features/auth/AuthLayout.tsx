import type { ReactNode } from 'react'
import bg from '@/assets/login-bg.jpg'
import crest from '@/assets/navy-crest.png'

/**
 * Figma login canvas: full-bleed navy photo (#2D3C82 base + image + rgba(42,64,133,.3) overlay),
 * left hero "Welcome to" (Barlow 42 #AFB58B) + "Central Inventory Management Software" (Barlow Bold 60 white),
 * right card 488px #F4F7FF r8 with 10px translucent border, crest 145×137, footer credit.
 */
export function AuthLayout({ children, title, subtitle }: { children: ReactNode; title?: string; subtitle?: string }) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-login-bg font-sans">
      <img src={bg} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-[rgba(42,64,133,0.3)]" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1920px] flex-col px-6 lg:flex-row lg:items-center lg:justify-between lg:px-[120px] 2xl:px-[239px]">
        <div className="pt-16 text-white lg:pt-0 lg:pr-10">
          <div className="font-hero text-[28px] leading-none tracking-[1.68px] text-login-hero sm:text-[42px]">Welcome to</div>
          <h1 className="mt-4 max-w-[817px] font-hero text-[40px] font-bold leading-[1.1] tracking-[2.4px] sm:text-[60px] sm:leading-[65px]">
            Central Inventory
            <br />
            Management Software
          </h1>
        </div>

        <div className="my-10 w-full max-w-[488px] self-center rounded-card border-[10px] border-white/15 bg-login-card px-[39px] pb-16 pt-[90px] shadow-modal lg:my-0 lg:self-auto">
          <div className="mb-[52px] flex justify-center">
            <img src={crest} alt="Bangladesh Navy" className="h-[137px] w-[145px] object-contain" />
          </div>
          {title && (
            <div className="mb-6 text-center">
              <h2 className="text-xl font-medium text-primary">{title}</h2>
              {subtitle && <p className="mt-1 text-sm text-login-text">{subtitle}</p>}
            </div>
          )}
          {children}
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-4 z-10 text-center text-[13px] text-white/90">
        All Rights Reserved © {new Date().getFullYear()} <span className="font-medium">CIMS</span> &nbsp;|&nbsp; Designed &amp; Developed by{' '}
        <span className="font-medium">TotalOfftec.</span>
      </div>
    </div>
  )
}
