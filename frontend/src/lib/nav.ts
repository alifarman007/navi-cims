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
}

export interface NavItem {
  label: string
  module: ModuleCode
  icon: LucideIcon
  to?: string // leaf link (Dashboard)
  children?: NavChild[]
}

/** Sidebar tree exactly as in Figma (docs/03-figma-ui-spec.md § Navigation), plus Procurement Item Info (SRS). */
export const NAV: NavItem[] = [
  { label: 'Dashboard', module: 'dashboard', icon: LayoutDashboard, to: '/' },
  {
    label: 'Configuration',
    module: 'configuration',
    icon: Settings,
    children: [
      { label: 'Office', to: '/configuration/office' },
      { label: 'Appointment', to: '/configuration/appointment' },
      { label: 'Rank', to: '/configuration/rank' },
      { label: 'Country', to: '/configuration/country' },
      { label: 'Division', to: '/configuration/division' },
      { label: 'District', to: '/configuration/district' },
      { label: 'Upazila', to: '/configuration/upazila' },
    ],
  },
  {
    label: 'Item Management',
    module: 'item_management',
    icon: Package,
    children: [
      { label: 'Create Item', to: '/items/item' },
      { label: 'Create Item Unit', to: '/items/unit' },
      { label: 'Brand', to: '/items/brand' },
      { label: 'Model', to: '/items/model' },
      { label: 'Create Item Category', to: '/items/category' },
    ],
  },
  {
    label: 'Ship/Base Management',
    module: 'ship_base_management',
    icon: Ship,
    children: [
      { label: 'Create Ship/Base', to: '/ship-base/ship-base' },
      { label: 'Create Ship/Base Category', to: '/ship-base/category' },
    ],
  },
  {
    label: 'Inventory Management',
    module: 'inventory_management',
    icon: ClipboardList,
    children: [
      { label: 'Store', to: '/inventory/store' },
      { label: 'Opening Stock', to: '/inventory/opening-stock' },
      { label: 'Stock Balance', to: '/inventory/stock' },
    ],
  },
  {
    label: 'Procurement Item Info',
    module: 'procurement_item_info',
    icon: ShoppingCart,
    children: [{ label: 'Procurement Items', to: '/procurement/items' }],
  },
  {
    label: 'Allocation/Sanction',
    module: 'allocation_sanction',
    icon: Gavel,
    children: [{ label: 'Allocation/Sanction', to: '/allocation' }],
  },
  {
    label: 'Compilation/Verification',
    module: 'compilation_verification',
    icon: FileCheck2,
    children: [{ label: 'Compilation/Verification', to: '/verification' }],
  },
  {
    label: 'Report',
    module: 'report',
    icon: FolderOpen,
    children: [
      { label: 'Stock Summary', to: '/reports/stock-summary' },
      { label: 'Allocation Report', to: '/reports/allocations' },
      { label: 'Low Stock', to: '/reports/low-stock' },
    ],
  },
  {
    label: 'User Management',
    module: 'user_management',
    icon: Users,
    children: [
      { label: 'User', to: '/users/user' },
      { label: 'Role Permission', to: '/users/role-permission' },
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
