/** Shared "Item Details"-style sections for an allocation (used by the Allocation and Verification pages). */
import type { DetailSection } from '@/components/ui/Modal'
import { StatusText } from '@/components/ui/Misc'
import { fmtDate, fmtDateTime, fmtNumber, titleCase } from '@/lib/utils'
import type { Allocation, VerificationBrief } from './api'

export function refLabel(r?: { code?: string | null; name: string } | null): string {
  if (!r) return '--'
  return r.code ? `${r.code} - ${r.name}` : r.name
}

export function userLabel(u?: { username: string; full_name: string } | null): string {
  if (!u) return '--'
  return `${u.username} - ${u.full_name}`
}

export function latestVerification(row: Allocation): VerificationBrief | undefined {
  return row.verifications?.length ? row.verifications[row.verifications.length - 1] : undefined
}

export function allocationSections(row: Allocation): DetailSection[] {
  const sections: DetailSection[] = [
    {
      title: 'Allocation Info',
      rows: [
        { label: 'ID', value: row.code },
        { label: 'Type', value: titleCase(row.allocation_type) },
        { label: 'Fiscal Year', value: row.fiscal_year?.name ?? '--' },
        { label: 'Date', value: fmtDate(row.allocation_date) },
        { label: 'Store', value: refLabel(row.store) },
        { label: 'Item', value: refLabel(row.item) },
        { label: 'Ship/Base', value: refLabel(row.ship_base) },
        { label: 'Allocation Qty', value: fmtNumber(row.quantity, 3) },
        { label: 'Status', value: <StatusText status={row.status} /> },
        { label: 'Remarks', value: row.remarks || '--' },
        { label: 'Approved By', value: userLabel(row.approved_by) },
        { label: 'Approved At', value: fmtDateTime(row.approved_at) },
        { label: 'Created', value: fmtDateTime(row.created_at) },
      ],
    },
  ]
  sections.push({
    title: 'Verification History',
    content: row.verifications?.length ? (
      <table className="w-full text-[12px] leading-5 tracking-[0.5px] text-[#121212]">
        <thead>
          <tr className="text-left text-ink-cell">
            <th className="py-1 pr-3 font-medium">ID</th>
            <th className="py-1 pr-3 font-medium">Action</th>
            <th className="py-1 pr-3 font-medium">Approver</th>
            <th className="py-1 pr-3 font-medium">Comment</th>
            <th className="py-1 font-medium">Date</th>
          </tr>
        </thead>
        <tbody>
          {row.verifications.map((v) => (
            <tr key={v.id} className="border-t border-primary/5">
              <td className="py-1 pr-3">{v.code}</td>
              <td className="py-1 pr-3">
                <StatusText status={v.action} />
              </td>
              <td className="py-1 pr-3">{v.approver?.full_name ?? '--'}</td>
              <td className="py-1 pr-3">{v.comment || '--'}</td>
              <td className="py-1">{fmtDateTime(v.acted_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ) : (
      <p className="text-[12px] text-ink-cell">No verification yet — awaiting Compilation/Verification.</p>
    ),
  })
  return sections
}
