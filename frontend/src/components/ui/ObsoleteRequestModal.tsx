import type { ReactNode } from 'react'
import { X, Printer, Download, Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Modal } from './Modal'
import { Button } from './Button'
import { RowAction } from './RowActions'

/* ------------------------------------------------------------------ data contract */
export interface ObsoleteRequestItemInfo {
  title: string
  imcSpec: string
  deno: string
  acctStatus: string
  itemType: string
  group: string
  subGroup: string
  directorate: string
}
export interface ObsoleteRequestDocument {
  name: string
  url?: string | null
}
export interface ObsoleteRequestEntry {
  enteredBy: string
  date: string
  approvedBy: string
  approvedDate: string
  shipCode: string
  status: string
  editRemarks: string
}
export interface ObsoleteRequestData {
  /** up to 3 thumbnails; null/undefined = grey placeholder tile */
  images: (string | null | undefined)[]
  itemInfo: ObsoleteRequestItemInfo
  specification: { label: string; value?: ReactNode }[]
  documents: ObsoleteRequestDocument[]
  entries: ObsoleteRequestEntry[]
}

/** Figma sample content (rope, 3 delivery reports, one entry row). */
export const sampleObsoleteRequest: ObsoleteRequestData = {
  images: [null, null, null],
  itemInfo: {
    title: 'Rope, Polyester, Cir: 1inch Dia: 8mm',
    imcSpec: '55.114',
    deno: 'Meter',
    acctStatus: 'Quasi Permanent',
    itemType: 'Other',
    group: 'D',
    subGroup: 'Quasi Permanent',
    directorate: 'DNS',
  },
  specification: [
    { label: 'Item', value: 'Rope' },
    { label: 'Type', value: 'Polyester' },
    { label: 'Size : Cir: 1inch Dia', value: '8mm' },
    { label: 'Minimum Breaking Strength', value: '9.1kn' },
    { label: 'Safe Load (Safety Factor 12)', value: '0.760kn' },
    { label: 'Weight', value: '0.045kg/m' },
    { label: 'Part No' },
    { label: 'Additional Part No' },
    { label: 'Model No' },
    { label: 'Brand' },
    { label: "Manufacturer's Name" },
    { label: 'Manufacturer Country' },
    { label: 'Country of Origin' },
  ],
  documents: [{ name: 'Delivery Report' }, { name: 'Delivery Report' }, { name: 'Delivery Report' }],
  entries: [
    {
      enteredBy: 'Lt Cdr Kamal Hossain',
      date: '29/07/2025',
      approvedBy: 'Cdr Rafiq Ahmed',
      approvedDate: '02/08/2025',
      shipCode: 'BNS-SMD',
      status: 'Approved',
      editRemarks: '--',
    },
  ],
}

/* ------------------------------------------------------------------ building blocks */
const ROW =
  'flex gap-2 border-y border-primary/5 py-1 text-[11px] leading-5 tracking-[0.5px] text-[#121212] first:border-t-0'
const DASHED = 'rounded-b-[4px] border border-t-0 border-dashed border-primary/20 pb-3 pl-5 pr-4 pt-4'
const SOLID = 'rounded-b-[4px] border border-t-0 border-[rgba(210,210,210,0.6)] pb-3 pl-5 pr-4 pt-4'

function Section({ title, children, solid, className }: { title: string; children: ReactNode; solid?: boolean; className?: string }) {
  return (
    <section className={className}>
      <div className="rounded-t-[4px] bg-[#F5F5F5] px-5 py-0.5">
        <h4 className="text-lg font-medium text-primary">{title}</h4>
      </div>
      <div className={solid ? SOLID : DASHED}>{children}</div>
    </section>
  )
}

function Pair({ label, value, className }: { label: string; value?: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex min-w-0 gap-2', className)}>
      <span className="w-[150px] shrink-0">{label}</span>
      <span className="min-w-0 break-words">: {value ?? ''}</span>
    </span>
  )
}

function Thumb({ src }: { src?: string | null }) {
  return (
    <div className="flex h-[102px] w-[102px] shrink-0 items-center justify-center overflow-hidden rounded-[6px] border border-black/[0.06] bg-[#E8E4E4]">
      {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : <ImageIcon size={44} strokeWidth={1.4} className="text-[#A5A5A5]" />}
    </div>
  )
}

/* ------------------------------------------------------------------ modal */
export interface ObsoleteRequestModalProps {
  open: boolean
  onClose: () => void
  data: ObsoleteRequestData
  title?: string
  onPrint?: () => void
  onDownload?: () => void
  onViewDocument?: (doc: ObsoleteRequestDocument, index: number) => void
  onDownloadDocument?: (doc: ObsoleteRequestDocument, index: number) => void
}

/**
 * Figma "Obsolete Request" modal (83:4979): 792 wide, sticky action bar (#E9EBF6, border #BAC6FF, title Inter 600 14
 * #4B5563 + close), scrollable body with Item Image / Item Info / Item Specification / Documents / Entry Details
 * sections (#F5F5F5 header strip, Roboto 500 18 #1C3586; dashed content borders, Documents solid), sticky footer
 * (#F3F4F6, shadow) with Print (dark) + Download (red).
 */
export function ObsoleteRequestModal({
  open,
  onClose,
  data,
  title = 'Obsolete Request',
  onPrint,
  onDownload,
  onViewDocument,
  onDownloadDocument,
}: ObsoleteRequestModalProps) {
  const images = [...data.images, null, null, null].slice(0, 3)
  const info = data.itemInfo
  return (
    <Modal open={open} onClose={onClose} width={792}>
      <div className="flex shrink-0 items-center justify-between rounded-t-card border border-primary-200 bg-strip-modal px-5 py-3">
        <span className="font-modal text-sm font-semibold text-ink-modal">{title}</span>
        <button type="button" onClick={onClose} aria-label="Close" className="text-ink-cell hover:text-primary no-print">
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto bg-white px-[22px] py-[30px]">
        <Section title="Item Image">
          <div className="flex gap-5 rounded-[4px] bg-[#FCFCFC]">
            {images.map((src, i) => (
              <Thumb key={i} src={src} />
            ))}
          </div>
        </Section>

        <Section title="Item Info">
          <div className={ROW}>
            <Pair label="Title of Item" value={info.title} />
          </div>
          <div className={ROW}>
            <Pair label="IMC/Spec" value={info.imcSpec} />
          </div>
          <div className={cn(ROW, 'grid grid-cols-3 gap-x-4')}>
            <Pair label="Deno" value={info.deno} />
            <span>Acct Status : {info.acctStatus}</span>
            <span>Item Type : {info.itemType}</span>
          </div>
          <div className={cn(ROW, 'grid grid-cols-3 gap-x-4')}>
            <Pair label="Group" value={info.group} />
            <span>Sub Group : {info.subGroup}</span>
            <span>Directorate : {info.directorate}</span>
          </div>
        </Section>

        <Section title="Item Specification">
          {data.specification.map((r, i) => (
            <div key={i} className={ROW}>
              <Pair label={r.label} value={r.value} />
            </div>
          ))}
        </Section>

        <Section title="Documents" solid>
          <ol className="list-none">
            {data.documents.map((d, i) => (
              <li key={i} className="flex items-center justify-between border-y border-primary/5 py-1 text-[11px] leading-5 tracking-[0.5px] text-[#121212] first:border-t-0">
                <span>
                  {i + 1}. {d.name}
                </span>
                <span className="flex items-center gap-3">
                  <RowAction kind="view" onClick={() => (onViewDocument ? onViewDocument(d, i) : d.url && window.open(d.url, '_blank'))} />
                  <button
                    type="button"
                    title="Download"
                    aria-label="Download"
                    onClick={() => (onDownloadDocument ? onDownloadDocument(d, i) : d.url && window.open(d.url, '_blank'))}
                    className="inline-flex h-[30px] w-10 items-center justify-center rounded-tl-card rounded-br-card text-[#121212] hover:bg-black/5"
                  >
                    <Download size={18} />
                  </button>
                </span>
              </li>
            ))}
            {data.documents.length === 0 && <li className="py-2 text-[11px] text-ink-muted">No documents</li>}
          </ol>
        </Section>

        <Section title="Entry Details">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[11px] leading-5 tracking-[0.5px] text-[#121212]">
              <thead>
                <tr>
                  {['Entered By', 'Date', 'Approved By', 'Approved Date', 'Ship Code', 'Status', 'Edit Remarks'].map((h) => (
                    <th key={h} className="border border-[#D9D9D9] px-2 py-1 text-left font-normal">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.entries.map((e, i) => (
                  <tr key={i}>
                    {[e.enteredBy, e.date, e.approvedBy, e.approvedDate, e.shipCode, e.status, e.editRemarks].map((v, j) => (
                      <td key={j} className="border border-[#D9D9D9] px-2 py-1">
                        {v || '--'}
                      </td>
                    ))}
                  </tr>
                ))}
                {data.entries.length === 0 && (
                  <tr>
                    <td colSpan={7} className="border border-[#D9D9D9] px-2 py-1 text-ink-muted">
                      No entries
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Section>
      </div>

      <div className="flex h-[84px] shrink-0 items-center justify-end gap-5 rounded-b-card bg-[#F3F4F6] px-5 py-4 shadow-[0_-2px_2px_rgba(0,0,0,0.08)] no-print">
        <Button variant="dark" icon={<Printer size={16} />} onClick={onPrint ?? (() => window.print())}>
          Print
        </Button>
        <Button variant="danger" icon={<Download size={18} />} onClick={onDownload}>
          Download
        </Button>
      </div>
    </Modal>
  )
}
