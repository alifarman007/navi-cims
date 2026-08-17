/**
 * Dashboard (SRS: "interactive dashboard with statistical diagrams; must show allocation info").
 * No Figma screen exists — built from the app's own design language + DSIG chart ideas.
 * Data: GET /dashboard/summary (see backend endpoints/dashboard.py).
 */
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Package, Ship, Warehouse, Users, Clock, CheckCircle2, Undo2, AlertTriangle } from 'lucide-react'
import { api } from '@/api/client'
import { PageLoader, StatusText, EmptyState } from '@/components/ui/Misc'
import { fmtDate, fmtNumber, errorMessage } from '@/lib/utils'
import type { Ref } from '@/types/api'

/* ------------------------------------------------------------------ types */
interface Summary {
  counts: {
    items: number
    ship_bases: number
    stores: number
    users: number
    allocations_pending: number
    allocations_approved: number
    allocations_sent_back: number
    low_stock_items: number
  }
  allocations_by_status: { status: string; count: number }[]
  allocations_by_fiscal_year: { fiscal_year: string; allocation: number; sanction: number; total_qty: string | number }[]
  allocations_by_ship_base: { ship_base: string; count: number; qty: string | number }[]
  items_by_category: { category: string; count: number }[]
  stock_by_store: { store: string; items: number; total_qty: string | number }[]
  recent_allocations: {
    id: number
    code: string
    type: string
    fiscal_year?: { id: number; name: string } | null
    date: string
    store?: Ref | null
    item?: Ref | null
    ship_base?: Ref | null
    quantity: string | number
    status: string
  }[]
  low_stock: { id?: number; store?: Ref | string | null; item?: Ref | string | null; quantity: string | number; low_stock_threshold?: string | number | null }[]
}

/* palette (validated with the dataviz validator): categorical pair + reserved status colours */
const C_ALLOC = '#3F569E'
const C_SANC = '#C2410C'
const C_SINGLE = '#3F569E'
const STATUS_COLORS: Record<string, string> = { pending: '#ED841A', approved: '#0E9F6E', sent_back: '#CD3F32', cancelled: '#ACACAC' }
const AXIS = { fontSize: 12, fill: '#636363' }
const GRID = '#ECECF4'

/* ------------------------------------------------------------------ page */
export default function DashboardPage() {
  const q = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: () => api.get<Summary>('/dashboard/summary').then((r) => r.data),
    refetchInterval: 120_000,
  })

  if (q.isLoading) return <PageLoader />
  if (q.isError || !q.data)
    return (
      <div className="card p-8 text-center text-sm text-danger">
        Failed to load dashboard: {errorMessage(q.error)}
      </div>
    )
  const d = q.data
  const c = d.counts

  const statusData = ['pending', 'approved', 'sent_back', 'cancelled'].map((s) => ({
    status: s,
    label: s.replace('_', ' ').replace(/\b\w/g, (m) => m.toUpperCase()),
    count: d.allocations_by_status.find((x) => x.status === s)?.count ?? 0,
  }))
  const byCategory = mergeBy(d.items_by_category, 'category', 'count').slice(0, 10)
  const byStore = d.stock_by_store.map((s) => ({ ...s, total_qty: Number(s.total_qty) })).slice(0, 10)
  const byShip = d.allocations_by_ship_base.map((s) => ({ ...s, qty: Number(s.qty) })).slice(0, 10)

  return (
    <div className="flex flex-col gap-6">
      {/* stat tiles */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-8">
        <Stat title="Items" value={c.items} icon={<Package size={20} />} to="/items/item" />
        <Stat title="Ships / Bases" value={c.ship_bases} icon={<Ship size={20} />} to="/ship-base/ship-base" />
        <Stat title="Stores" value={c.stores} icon={<Warehouse size={20} />} to="/inventory/store" />
        <Stat title="Active Users" value={c.users} icon={<Users size={20} />} to="/users/user" />
        <Stat title="Pending Allocations" value={c.allocations_pending} icon={<Clock size={20} />} tone="orange" to="/allocation" />
        <Stat title="Approved Allocations" value={c.allocations_approved} icon={<CheckCircle2 size={20} />} tone="green" to="/allocation" />
        <Stat title="Sent Back" value={c.allocations_sent_back} icon={<Undo2 size={20} />} tone="red" to="/verification" />
        <Stat title="Low Stock Items" value={c.low_stock_items} icon={<AlertTriangle size={20} />} tone={c.low_stock_items ? 'red' : 'grey'} to="/reports/low-stock" />
      </div>

      {/* charts row 1 */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <ChartCard title="Allocations by Fiscal Year" subtitle="Allocation vs Sanction (count)" className="xl:col-span-2">
          {d.allocations_by_fiscal_year.length === 0 ? (
            <EmptyState title="No allocations yet" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={d.allocations_by_fiscal_year} margin={{ top: 8, right: 8, left: -12, bottom: 0 }} barGap={2}>
                <CartesianGrid vertical={false} stroke={GRID} />
                <XAxis dataKey="fiscal_year" tick={AXIS} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip cursor={{ fill: 'rgba(63,86,158,0.06)' }} contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#4B5563' }} />
                <Bar dataKey="allocation" name="Allocation" fill={C_ALLOC} radius={[4, 4, 0, 0]} maxBarSize={44} />
                <Bar dataKey="sanction" name="Sanction" fill={C_SANC} radius={[4, 4, 0, 0]} maxBarSize={44} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Allocations by Status" subtitle="All time">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={statusData} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 0 }}>
              <CartesianGrid horizontal={false} stroke={GRID} />
              <XAxis type="number" tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="label" tick={AXIS} axisLine={false} tickLine={false} width={84} />
              <Tooltip cursor={{ fill: 'rgba(63,86,158,0.06)' }} contentStyle={tooltipStyle} />
              <Bar dataKey="count" name="Allocations" radius={[0, 4, 4, 0]} maxBarSize={26} label={{ position: 'right', fontSize: 12, fill: '#4B5563' }}>
                {statusData.map((s) => (
                  <Cell key={s.status} fill={STATUS_COLORS[s.status]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* charts row 2 */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <ChartCard title="Items by Category" subtitle="Top 10 categories">
          {byCategory.length === 0 ? (
            <EmptyState title="No items yet" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={byCategory} margin={{ top: 8, right: 8, left: -12, bottom: 24 }}>
                <CartesianGrid vertical={false} stroke={GRID} />
                <XAxis dataKey="category" tick={{ ...AXIS, fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={50} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip cursor={{ fill: 'rgba(63,86,158,0.06)' }} contentStyle={tooltipStyle} />
                <Bar dataKey="count" name="Items" fill={C_SINGLE} radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
        <ChartCard title="Stock Quantity by Store" subtitle="Sum of on-hand quantities">
          {byStore.length === 0 ? (
            <EmptyState title="No stock yet" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={byStore} margin={{ top: 8, right: 8, left: -4, bottom: 24 }}>
                <CartesianGrid vertical={false} stroke={GRID} />
                <XAxis dataKey="store" tick={{ ...AXIS, fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={50} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'rgba(63,86,158,0.06)' }} contentStyle={tooltipStyle} formatter={(v: number) => fmtNumber(v, 3)} />
                <Bar dataKey="total_qty" name="Quantity" fill={C_SINGLE} radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
        <ChartCard title="Allocations by Ship/Base" subtitle="Top 10 by number of allocations">
          {byShip.length === 0 ? (
            <EmptyState title="No allocations yet" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={byShip} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 0 }}>
                <CartesianGrid horizontal={false} stroke={GRID} />
                <XAxis type="number" tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="ship_base" tick={{ ...AXIS, fontSize: 11 }} axisLine={false} tickLine={false} width={120} />
                <Tooltip cursor={{ fill: 'rgba(63,86,158,0.06)' }} contentStyle={tooltipStyle} />
                <Bar dataKey="count" name="Allocations" fill={C_SINGLE} radius={[0, 4, 4, 0]} maxBarSize={22} label={{ position: 'right', fontSize: 12, fill: '#4B5563' }} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* tables */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="card px-6 pb-6 pt-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-medium text-ink-heading">Recent Allocations</h3>
            <Link to="/allocation" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          <MiniTable
            headers={['ID', 'Type', 'Item', 'Ship/Base', 'Qty', 'Date', 'Status']}
            rows={d.recent_allocations.map((a) => [
              a.code,
              a.type === 'sanction' ? 'Sanction' : 'Allocation',
              a.item?.name ?? '--',
              a.ship_base?.name ?? '--',
              fmtNumber(a.quantity, 3),
              fmtDate(a.date),
              <StatusText key="s" status={a.status} />,
            ])}
            empty="No allocations yet"
          />
        </section>
        <section className="card px-6 pb-6 pt-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-medium text-ink-heading">Low Stock</h3>
            <Link to="/reports/low-stock" className="text-sm text-primary hover:underline">
              Full report
            </Link>
          </div>
          <MiniTable
            headers={['Store', 'Item', 'Quantity', 'Threshold']}
            rows={d.low_stock.map((s) => [
              refName(s.store),
              refName(s.item),
              fmtNumber(s.quantity, 3),
              fmtNumber(s.low_stock_threshold ?? null, 3),
            ])}
            empty="No items below their low-stock threshold"
          />
        </section>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ pieces */
const tooltipStyle = { borderRadius: 8, border: '1px solid rgba(0,0,0,0.1)', fontSize: 12, fontFamily: 'Roboto, sans-serif' }

function refName(v: Ref | string | null | undefined): string {
  if (!v) return '--'
  return typeof v === 'string' ? v : v.name
}

function mergeBy<T extends Record<string, unknown>>(rows: T[], key: keyof T, valueKey: keyof T) {
  const map = new Map<string, number>()
  for (const r of rows) {
    const k = String(r[key] ?? '--')
    map.set(k, (map.get(k) ?? 0) + Number(r[valueKey] ?? 0))
  }
  return [...map.entries()].map(([k, v]) => ({ [key]: k, [valueKey]: v }) as T).sort((a, b) => Number(b[valueKey]) - Number(a[valueKey]))
}

function Stat({
  title,
  value,
  icon,
  tone = 'primary',
  to,
}: {
  title: string
  value: number
  icon: React.ReactNode
  tone?: 'primary' | 'orange' | 'green' | 'red' | 'grey'
  to?: string
}) {
  const tones = {
    primary: 'bg-strip text-primary',
    orange: 'bg-orange-50 text-accent',
    green: 'bg-action-approveBg text-status-active',
    red: 'bg-action-deleteBg text-action-delete',
    grey: 'bg-gray-100 text-ink-cell',
  }
  const body = (
    <div className="card flex h-full items-center gap-3 px-4 py-4 transition-shadow hover:shadow-card">
      <span className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-card ${tones[tone]}`}>{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="text-2xl font-medium leading-none text-ink-heading 2xl:text-[22px]">{fmtNumber(value)}</div>
        <div className="mt-1 text-xs leading-snug text-ink-muted">{title}</div>
      </div>
    </div>
  )
  return to ? <Link to={to}>{body}</Link> : body
}

function ChartCard({ title, subtitle, children, className }: { title: string; subtitle?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`card px-5 pb-4 pt-4 ${className ?? ''}`}>
      <div className="mb-2">
        <h3 className="text-base font-medium text-ink-heading">{title}</h3>
        {subtitle && <p className="text-xs text-ink-muted">{subtitle}</p>}
      </div>
      {children}
    </section>
  )
}

function MiniTable({ headers, rows, empty }: { headers: string[]; rows: React.ReactNode[][]; empty: string }) {
  if (rows.length === 0) return <EmptyState title={empty} className="py-8" />
  return (
    <div className="overflow-x-auto rounded-card border border-black/[0.08]">
      <table className="w-full text-left text-sm">
        <thead className="bg-strip">
          <tr>
            {headers.map((h) => (
              <th key={h} className="h-10 whitespace-nowrap px-4 text-sm font-medium tracking-[0.3px] text-ink-heading">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={`h-10 border-t border-line ${i % 2 === 0 ? 'bg-zebra' : 'bg-white'}`}>
              {r.map((cell, j) => (
                <td key={j} className="whitespace-nowrap px-4 text-ink-cell">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
