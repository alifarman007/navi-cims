import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  Settings,
  Package,
  Ship,
  ClipboardList,
  ShoppingCart,
  Gavel,
  FileCheck2,
  FolderOpen,
  Users,
} from 'lucide-react'
import type { ModuleCode } from '@/types/api'

export interface NavChild {
  label: string
  to: string
  /** dynamic import of the page chunk — called on hover/focus to prefetch (same specifier as routes.tsx → same chunk) */
  preload?: () => Promise<unknown>
}

export interface NavItem {
  label: string
  module: ModuleCode
  icon: LucideIcon
  to?: string // leaf link (Dashboard)
  preload?: () => Promise<unknown>
  children?: NavChild[]
}

/** Sidebar tree exactly as in Figma (docs/03-figma-ui-spec.md § Navigation), plus Procurement Item Info (SRS). */
export const NAV: NavItem[] = [
  { label: 'Dashboard', module: 'dashboard', icon: LayoutDashboard, to: '/', preload: () => import('@/features/dashboard/DashboardPage') },
  {
    label: 'Configuration',
    module: 'configuration',
    icon: Settings,
    children: [
      { label: 'Office', to: '/configuration/office', preload: () => import('@/features/configuration/OfficePage') },
      { label: 'Appointment', to: '/configuration/appointment', preload: () => import('@/features/configuration/AppointmentPage') },
      { label: 'Rank', to: '/configuration/rank', preload: () => import('@/features/configuration/RankPage') },
      { label: 'Country', to: '/configuration/country', preload: () => import('@/features/configuration/CountryPage') },
      { label: 'Division', to: '/configuration/division', preload: () => import('@/features/configuration/DivisionPage') },
      { label: 'District', to: '/configuration/district', preload: () => import('@/features/configuration/DistrictPage') },
      { label: 'Upazila', to: '/configuration/upazila', preload: () => import('@/features/configuration/UpazilaPage') },
    ],
  },
  {
    label: 'Item Management',
    module: 'item_management',
    icon: Package,
    children: [
      { label: 'Create Item', to: '/items/item', preload: () => import('@/features/items/item/ItemPage') },
      { label: 'Create Item Unit', to: '/items/unit', preload: () => import('@/features/items/unit/ItemUnitPage') },
      { label: 'Brand', to: '/items/brand', preload: () => import('@/features/items/brand/BrandPage') },
      { label: 'Model', to: '/items/model', preload: () => import('@/features/items/model/ModelPage') },
      { label: 'Create Item Category', to: '/items/category', preload: () => import('@/features/items/category/ItemCategoryPage') },
    ],
  },
  {
    label: 'Ship/Base Management',
    module: 'ship_base_management',
    icon: Ship,
    children: [
      { label: 'Create Ship/Base', to: '/ship-base/ship-base', preload: () => import('@/features/ship-base/ShipBasePage') },
      { label: 'Create Ship/Base Category', to: '/ship-base/category', preload: () => import('@/features/ship-base/ShipBaseCategoryPage') },
    ],
  },
  {
    label: 'Inventory Management',
    module: 'inventory_management',
    icon: ClipboardList,
    children: [
      { label: 'Store', to: '/inventory/store', preload: () => import('@/features/inventory/StorePage') },
      { label: 'Opening Stock', to: '/inventory/opening-stock', preload: () => import('@/features/inventory/OpeningStockPage') },
      { label: 'Stock Balance', to: '/inventory/stock', preload: () => import('@/features/inventory/StockPage') },
    ],
  },
  {
    label: 'Procurement Item Info',
    module: 'procurement_item_info',
    icon: ShoppingCart,
    children: [{ label: 'Procurement Items', to: '/procurement/items', preload: () => import('@/features/procurement/ProcurementItemsPage') }],
  },
  {
    label: 'Allocation/Sanction',
    module: 'allocation_sanction',
    icon: Gavel,
    children: [{ label: 'Allocation/Sanction', to: '/allocation', preload: () => import('@/features/allocation/AllocationPage') }],
  },
  {
    label: 'Compilation/Verification',
    module: 'compilation_verification',
    icon: FileCheck2,
    children: [{ label: 'Compilation/Verification', to: '/verification', preload: () => import('@/features/verification/VerificationPage') }],
  },
  {
    label: 'Report',
    module: 'report',
    icon: FolderOpen,
    children: [
      { label: 'Stock Summary', to: '/reports/stock-summary', preload: () => import('@/features/reports/StockSummaryReportPage') },
      { label: 'Allocation Report', to: '/reports/allocations', preload: () => import('@/features/reports/AllocationReportPage') },
      { label: 'Low Stock', to: '/reports/low-stock', preload: () => import('@/features/reports/LowStockReportPage') },
    ],
  },
  {
    label: 'User Management',
    module: 'user_management',
    icon: Users,
    children: [
      { label: 'User', to: '/users/user', preload: () => import('@/features/users/UserPage') },
      { label: 'Role Permission', to: '/users/role-permission', preload: () => import('@/features/users/RolePermissionListPage') },
    ],
  },
]

/** Find parent + child labels for a pathname (used by breadcrumb fallback). */
export function findNav(pathname: string): { parent?: NavItem; child?: NavChild } {
  for (const item of NAV) {
    if (item.to && item.to === pathname) return { parent: item }
    for (const c of item.children ?? []) {
      if (pathname === c.to || pathname.startsWith(c.to + '/')) return { parent: item, child: c }
    }
  }
  return {}
}
