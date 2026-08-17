import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { RequireAuth, RequireGuest, RequirePermission } from '@/app/guards'
import { PageLoader } from '@/components/ui/Misc'
import type { ModuleCode } from '@/types/api'
import type { Crumb } from '@/components/layout/Header'

/* ---------------------------------------------------------------- lazy pages */
const LoginPage = lazy(() => import('@/features/auth/LoginPage'))
const PasswordPages = () => import('@/features/auth/PasswordPages')
const ForgotPasswordPage = lazy(() => PasswordPages().then((m) => ({ default: m.ForgotPasswordPage })))
const ResetPasswordPage = lazy(() => PasswordPages().then((m) => ({ default: m.ResetPasswordPage })))
const ChangePasswordPage = lazy(() => PasswordPages().then((m) => ({ default: m.ChangePasswordPage })))

const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage'))
const OfficePage = lazy(() => import('@/features/configuration/OfficePage'))
const AppointmentPage = lazy(() => import('@/features/configuration/AppointmentPage'))
const RankPage = lazy(() => import('@/features/configuration/RankPage'))
const CountryPage = lazy(() => import('@/features/configuration/CountryPage'))
const DivisionPage = lazy(() => import('@/features/configuration/DivisionPage'))
const DistrictPage = lazy(() => import('@/features/configuration/DistrictPage'))
const UpazilaPage = lazy(() => import('@/features/configuration/UpazilaPage'))
const ItemPage = lazy(() => import('@/features/items/item/ItemPage'))
const ItemUnitPage = lazy(() => import('@/features/items/unit/ItemUnitPage'))
const BrandPage = lazy(() => import('@/features/items/brand/BrandPage'))
const ModelPage = lazy(() => import('@/features/items/model/ModelPage'))
const ItemCategoryPage = lazy(() => import('@/features/items/category/ItemCategoryPage'))
const ShipBasePage = lazy(() => import('@/features/ship-base/ShipBasePage'))
const ShipBaseCategoryPage = lazy(() => import('@/features/ship-base/ShipBaseCategoryPage'))
const StorePage = lazy(() => import('@/features/inventory/StorePage'))
const OpeningStockPage = lazy(() => import('@/features/inventory/OpeningStockPage'))
const StockPage = lazy(() => import('@/features/inventory/StockPage'))
const ProcurementItemsPage = lazy(() => import('@/features/procurement/ProcurementItemsPage'))
const AllocationPage = lazy(() => import('@/features/allocation/AllocationPage'))
const VerificationPage = lazy(() => import('@/features/verification/VerificationPage'))
const StockSummaryReportPage = lazy(() => import('@/features/reports/StockSummaryReportPage'))
const AllocationReportPage = lazy(() => import('@/features/reports/AllocationReportPage'))
const LowStockReportPage = lazy(() => import('@/features/reports/LowStockReportPage'))
const UserPage = lazy(() => import('@/features/users/UserPage'))
const RolePermissionListPage = lazy(() => import('@/features/users/RolePermissionListPage'))
const RolePermissionFormPage = lazy(() => import('@/features/users/RolePermissionFormPage'))
const UiKitPage = lazy(() => import('@/features/ui-kit/UiKitPage'))

/* ---------------------------------------------------------------- helpers */
const S = (el: ReactNode) => <Suspense fallback={<PageLoader />}>{el}</Suspense>

/** page route with permission guard + breadcrumb handle */
function page(path: string, module: ModuleCode, crumbs: Crumb[], el: ReactNode, action: 'list' | 'view' = 'list'): RouteObject {
  return {
    path,
    handle: { crumbs, module },
    element: S(<RequirePermission module={module} action={action}>{el}</RequirePermission>),
  }
}

function NotFound() {
  return (
    <div className="card mx-auto mt-10 max-w-lg p-10 text-center">
      <div className="text-5xl font-medium text-primary">404</div>
      <p className="mt-3 text-ink-cell">Page not found.</p>
    </div>
  )
}

/* ---------------------------------------------------------------- router */
export const router = createBrowserRouter([
  {
    element: <RequireGuest />,
    children: [
      { path: '/login', element: S(<LoginPage />) },
      { path: '/forgot-password', element: S(<ForgotPasswordPage />) },
      { path: '/reset-password/:token', element: S(<ResetPasswordPage />) },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppShell />,
        children: [
          page('/', 'dashboard', [{ label: 'Dashboard' }], <DashboardPage />),

          page('/configuration/office', 'configuration', [{ label: 'Configuration' }, { label: 'Office' }], <OfficePage />),
          page('/configuration/appointment', 'configuration', [{ label: 'Configuration' }, { label: 'Appointment' }], <AppointmentPage />),
          page('/configuration/rank', 'configuration', [{ label: 'Configuration' }, { label: 'Rank' }], <RankPage />),
          page('/configuration/country', 'configuration', [{ label: 'Configuration' }, { label: 'Country' }], <CountryPage />),
          page('/configuration/division', 'configuration', [{ label: 'Configuration' }, { label: 'Division' }], <DivisionPage />),
          page('/configuration/district', 'configuration', [{ label: 'Configuration' }, { label: 'District' }], <DistrictPage />),
          page('/configuration/upazila', 'configuration', [{ label: 'Configuration' }, { label: 'Upazila' }], <UpazilaPage />),

          page('/items/item', 'item_management', [{ label: 'Item Management' }, { label: 'Create Item' }], <ItemPage />),
          page('/items/unit', 'item_management', [{ label: 'Item Management' }, { label: 'Create Item Unit' }], <ItemUnitPage />),
          page('/items/brand', 'item_management', [{ label: 'Item Management' }, { label: 'Brand' }], <BrandPage />),
          page('/items/model', 'item_management', [{ label: 'Item Management' }, { label: 'Model' }], <ModelPage />),
          page('/items/category', 'item_management', [{ label: 'Item Management' }, { label: 'Create Item Category' }], <ItemCategoryPage />),

          page('/ship-base/ship-base', 'ship_base_management', [{ label: 'Ship/Base Management' }, { label: 'Create Ship/Base' }], <ShipBasePage />),
          page('/ship-base/category', 'ship_base_management', [{ label: 'Ship/Base Management' }, { label: 'Create Ship/Base Category' }], <ShipBaseCategoryPage />),

          page('/inventory/store', 'inventory_management', [{ label: 'Inventory Management' }, { label: 'Store' }], <StorePage />),
          page('/inventory/opening-stock', 'inventory_management', [{ label: 'Inventory Management' }, { label: 'Opening Stock' }], <OpeningStockPage />),
          page('/inventory/stock', 'inventory_management', [{ label: 'Inventory Management' }, { label: 'Stock Balance' }], <StockPage />),

          page('/procurement/items', 'procurement_item_info', [{ label: 'Procurement Item Info' }, { label: 'Procurement Items' }], <ProcurementItemsPage />),

          page('/allocation', 'allocation_sanction', [{ label: 'Allocation/Sanction' }, { label: 'Allocation/Sanction' }], <AllocationPage />),
          page('/verification', 'compilation_verification', [{ label: 'Compilation/Verification' }, { label: 'Compilation/Verification' }], <VerificationPage />),

          page('/reports/stock-summary', 'report', [{ label: 'Report' }, { label: 'Stock Summary' }], <StockSummaryReportPage />),
          page('/reports/allocations', 'report', [{ label: 'Report' }, { label: 'Allocation Report' }], <AllocationReportPage />),
          page('/reports/low-stock', 'report', [{ label: 'Report' }, { label: 'Low Stock' }], <LowStockReportPage />),

          page('/users/user', 'user_management', [{ label: 'User Management' }, { label: 'User' }], <UserPage />),
          page('/users/role-permission', 'user_management', [{ label: 'User Management' }, { label: 'Role Permission', to: '/users/role-permission' }], <RolePermissionListPage />),
          page(
            '/users/role-permission/create',
            'user_management',
            [{ label: 'User Management' }, { label: 'Role Permission', to: '/users/role-permission' }, { label: 'Create Role' }],
            <RolePermissionFormPage />,
          ),
          page(
            '/users/role-permission/:id/edit',
            'user_management',
            [{ label: 'User Management' }, { label: 'Role Permission', to: '/users/role-permission' }, { label: 'Edit' }],
            <RolePermissionFormPage />,
          ),

          { path: '/change-password', handle: { crumbs: [{ label: 'Account' }, { label: 'Change Password' }] }, element: S(<ChangePasswordPage />) },
          ...(import.meta.env.DEV ? [{ path: '/ui-kit', handle: { crumbs: [{ label: 'Developer' }, { label: 'UI Kit' }] }, element: S(<UiKitPage />) }] : []),
          { path: '/dashboard', element: <Navigate to="/" replace /> },
          { path: '*', element: <NotFound /> },
        ],
      },
    ],
  },
], { future: { v7_relativeSplatPath: true, v7_fetcherPersist: true, v7_normalizeFormMethod: true, v7_partialHydration: true, v7_skipActionErrorRevalidation: true } })
