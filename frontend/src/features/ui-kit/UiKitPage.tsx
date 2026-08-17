/**
 * Developer › UI Kit (dev-only route /ui-kit): renders every ui component in each variant/state, side by side,
 * so the kit can be eyeballed against the Figma screens (visual regression). Not linked from the sidebar.
 */
import { useState, type ReactNode } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { CheckCircle2, Eraser, Printer, Download, RefreshCw, Plus } from 'lucide-react'
import { Button, type ButtonVariant } from '@/components/ui/Button'
import { DateInput, Input, PasswordInput, Select, Textarea, YearSelect } from '@/components/ui/Input'
import { Checkbox, StatusRadio } from '@/components/ui/Checkbox'
import { AsyncSelect } from '@/components/ui/AsyncSelect'
import { CollapsibleCard, Fieldset, FormActions, FormField, FormGrid, ListCard } from '@/components/ui/Form'
import { DataTable } from '@/components/ui/DataTable'
import { Pagination } from '@/components/ui/Pagination'
import { RowAction, RowActions, type RowActionKind } from '@/components/ui/RowActions'
import { Badge, EmptyState, PageLoader, Popover, Spinner, StatusText } from '@/components/ui/Misc'
import { CommentDialog, ConfirmDialog, DetailModal, Modal, type ConfirmTone } from '@/components/ui/Modal'
import { ObsoleteRequestModal, sampleObsoleteRequest } from '@/components/ui/ObsoleteRequestModal'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ helpers */
function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <CollapsibleCard title={title}>
      {hint && <p className="mb-4 text-sm text-ink-muted">{hint}</p>}
      {children}
    </CollapsibleCard>
  )
}

function Row({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-4 border-b border-line py-3 last:border-b-0', className)}>
      <span className="w-40 shrink-0 text-13 font-medium uppercase tracking-wide text-ink-muted">{label}</span>
      <div className="flex flex-1 flex-wrap items-center gap-3">{children}</div>
    </div>
  )
}

const BUTTON_VARIANTS: { v: ButtonVariant; label: string; icon?: ReactNode }[] = [
  { v: 'primary', label: 'Save', icon: <CheckCircle2 size={16} /> },
  { v: 'alt', label: 'Create Role Permission', icon: <Plus size={16} /> },
  { v: 'clear', label: 'Clear All', icon: <Eraser size={18} /> },
  { v: 'outline', label: 'Cancel' },
  { v: 'confirm', label: 'Confirm' },
  { v: 'dark', label: 'Print', icon: <Printer size={16} /> },
  { v: 'danger', label: 'Download', icon: <Download size={18} /> },
  { v: 'toastCancel', label: 'Cancel' },
  { v: 'ghost', label: 'Ghost' },
  { v: 'back', label: 'Back' },
]

const ROW_ACTION_KINDS: RowActionKind[] = ['view', 'edit', 'delete', 'approve', 'reject', 'back', 'forward', 'transfer', 'download']

interface MockRow {
  id: number
  code: string
  name: string
  brand: string
  qty: number
  status: 'active' | 'inactive'
  workflow: 'pending' | 'approved' | 'sent_back' | 'cancelled'
}
const MOCK_ROWS: MockRow[] = Array.from({ length: 23 }, (_, i) => ({
  id: i + 1,
  code: `ITM-${String(i + 1).padStart(3, '0')}`,
  name: ['Rope, Polyester 8mm', 'Clamp, Air Cleaner', 'Filter, Fuel', 'Cable, RG-213', 'Paint, Marine Grey', 'Valve, Gate 2in'][i % 6],
  brand: ['Yamaha', 'Bosch', 'Marlow', 'Jotun'][i % 4],
  qty: (i + 1) * 12,
  status: i % 3 === 0 ? 'inactive' : 'active',
  workflow: (['pending', 'approved', 'sent_back', 'cancelled'] as const)[i % 4],
}))

const MOCK_COLUMNS: ColumnDef<MockRow, unknown>[] = [
  { id: 'code', header: 'Item ID', accessorKey: 'code', meta: { sortKey: 'code', filterKey: 'code', width: 140 } },
  { id: 'name', header: 'Item Name', accessorKey: 'name', meta: { sortKey: 'name', filterKey: 'name' } },
  { id: 'brand', header: 'Brand', accessorKey: 'brand', meta: { sortKey: 'brand', filterKey: 'brand', width: 160 } },
  { id: 'qty', header: 'Quantity', accessorKey: 'qty', meta: { sortKey: 'qty', width: 120, align: 'right' } },
  {
    id: 'workflow',
    header: 'Workflow',
    accessorKey: 'workflow',
    cell: ({ getValue }) => <StatusText status={getValue<string>()} />,
    meta: { width: 140 },
  },
  {
    id: 'status',
    header: 'Status',
    accessorKey: 'status',
    cell: ({ getValue }) => <StatusText status={getValue<string>()} />,
    meta: {
      sortKey: 'status',
      filterKey: 'status',
      width: 160,
      filterOptions: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
      ],
    },
  },
]

const FAKE_OPTIONS = [
  { id: 1, label: 'BR-001 - Yamaha' },
  { id: 2, label: 'BR-002 - Bosch' },
  { id: 3, label: 'BR-003 - Marlow' },
]

/* ------------------------------------------------------------------ page */
export default function UiKitPage() {
  // inputs
  const [text, setText] = useState('')
  const [pwd, setPwd] = useState('Secret@123')
  const [sel, setSel] = useState('')
  const [asyncSel, setAsyncSel] = useState('')
  const [date, setDate] = useState('')
  const [year, setYear] = useState('')
  const [area, setArea] = useState('')
  const [status, setStatus] = useState<'active' | 'inactive'>('active')
  const [checked, setChecked] = useState(true)
  // table
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sort, setSort] = useState<string | undefined>()
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [emptyTable, setEmptyTable] = useState(false)
  const [loadingTable, setLoadingTable] = useState(false)
  // modals
  const [detail, setDetail] = useState(false)
  const [detailFull, setDetailFull] = useState(false)
  const [confirm, setConfirm] = useState<ConfirmTone | null>(null)
  const [comment, setComment] = useState<'back' | 'forward' | null>(null)
  const [obsolete, setObsolete] = useState(false)
  const [plain, setPlain] = useState(false)
  const [busy, setBusy] = useState(false)

  const filtered = MOCK_ROWS.filter((r) =>
    Object.entries(filters).every(([k, v]) => !v || String(r[k as keyof MockRow]).toLowerCase().includes(v.toLowerCase())),
  )
  const sorted = [...filtered].sort((a, b) => {
    if (!sort) return 0
    const [f, d] = sort.split(':')
    const av = a[f as keyof MockRow]
    const bv = b[f as keyof MockRow]
    const c = av < bv ? -1 : av > bv ? 1 : 0
    return d === 'desc' ? -c : c
  })
  const rows = emptyTable ? [] : sorted.slice((page - 1) * pageSize, page * pageSize)
  const total = emptyTable ? 0 : sorted.length
  const pages = Math.ceil(total / pageSize)

  return (
    <div className="flex flex-col gap-[30px]">
      <ListCard title="UI Kit — component showcase" toolbar={<Badge tone="orange">dev only</Badge>}>
        <p className="text-sm text-ink-muted">
          Every shared component in every variant/state, for visual regression against the Figma screens (docs/figma/screens). Open the
          modals with the buttons in each section; toasts use the app toaster.
        </p>
      </ListCard>

      {/* ---------------------------------------------------------------- buttons */}
      <Section title="Buttons" hint="variant × size × state (icon right per Figma Save/Clear All)">
        <Row label="Variants (md)">
          {BUTTON_VARIANTS.map((b) => (
            <Button key={b.v} variant={b.v} icon={b.icon} onClick={() => toast.success(`${b.label} clicked`)}>
              {b.label}
            </Button>
          ))}
        </Row>
        <Row label="Sizes">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
          <Button size="sm" variant="alt" className="h-9 px-4 text-sm" icon={<RefreshCw size={15} />}>
            Sync from BNPIMS
          </Button>
        </Row>
        <Row label="States">
          <Button loading>Saving</Button>
          <Button disabled>Disabled</Button>
          <Button variant="clear" disabled icon={<Eraser size={18} />}>
            Disabled
          </Button>
          <Button variant="primary" iconLeft={<Plus size={16} />}>
            Icon left
          </Button>
        </Row>
      </Section>

      {/* ---------------------------------------------------------------- inputs */}
      <Section title="Inputs & form" hint="CollapsibleCard › Fieldset › FormGrid › FormField (label 14.5 #4C4C4C, red *)">
        <Fieldset>
          <FormGrid cols={3}>
            <FormField label="Text" required htmlFor="k-text">
              <Input id="k-text" value={text} onChange={(e) => setText(e.target.value)} />
            </FormField>
            <FormField label="Text (invalid)" required error="This field is required" htmlFor="k-text-err">
              <Input id="k-text-err" invalid value="" readOnly />
            </FormField>
            <FormField label="Text (disabled)" hint="Hint text under the field" htmlFor="k-text-dis">
              <Input id="k-text-dis" disabled value="Read only value" readOnly />
            </FormField>
            <FormField label="Password" htmlFor="k-pwd">
              <PasswordInput id="k-pwd" value={pwd} onChange={(e) => setPwd(e.target.value)} />
            </FormField>
            <FormField label="Select" required htmlFor="k-sel">
              <Select
                id="k-sel"
                value={sel}
                onChange={(e) => setSel(e.target.value)}
                options={[
                  { value: 'ship', label: 'Ship' },
                  { value: 'base', label: 'Base' },
                ]}
              />
            </FormField>
            <FormField label="Async select (options endpoint)" htmlFor="k-async">
              <AsyncSelect id="k-async" queryKey={['ui-kit', 'fake-options']} fetchOptions={() => Promise.resolve(FAKE_OPTIONS)} value={asyncSel} onChange={(e) => setAsyncSel(e.target.value)} />
            </FormField>
            <FormField label="Date" htmlFor="k-date">
              <DateInput id="k-date" value={date} onChange={(e) => setDate(e.target.value)} />
            </FormField>
            <FormField label="Year (Procurement Year)" htmlFor="k-year">
              <YearSelect id="k-year" value={year} onChange={(e) => setYear(e.target.value)} />
            </FormField>
            <FormField label="Status (radio pair)">
              <StatusRadio value={status} onChange={setStatus} name="kit-status" />
            </FormField>
            <FormField label="Status (disabled)">
              <StatusRadio value="inactive" onChange={() => undefined} disabled name="kit-status-dis" />
            </FormField>
            <FormField label="Textarea" htmlFor="k-area" className="md:col-span-2">
              <Textarea id="k-area" value={area} onChange={(e) => setArea(e.target.value)} rows={3} />
            </FormField>
            <FormField label="Checkbox">
              <div className="flex h-input flex-wrap items-center gap-6">
                <Checkbox label="Checked" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
                <Checkbox label="Unchecked" checked={false} onChange={() => undefined} />
                <Checkbox label="Disabled" checked disabled onChange={() => undefined} />
                <Checkbox label="Remember me" checked={false} disabled onChange={() => undefined} />
              </div>
            </FormField>
          </FormGrid>
        </Fieldset>
        <FormActions>
          <Button variant="clear" icon={<Eraser size={18} />} onClick={() => toast('Cleared')}>
            Clear All
          </Button>
          <Button variant="primary" icon={<CheckCircle2 size={16} />} onClick={() => toast.success('Saved successfully')}>
            Save
          </Button>
        </FormActions>
      </Section>

      {/* ---------------------------------------------------------------- misc */}
      <Section title="Status text, badges, row actions, feedback">
        <Row label="StatusText">
          {['active', 'inactive', 'pending', 'approved', 'sent_back', 'cancelled', null].map((s, i) => (
            <StatusText key={i} status={s} />
          ))}
        </Row>
        <Row label="Badge">
          {(['primary', 'green', 'red', 'grey', 'orange'] as const).map((t) => (
            <Badge key={t} tone={t}>
              {t}
            </Badge>
          ))}
          <span className="relative inline-flex">
            <span className="text-ink-cell">Bell badge</span>
            <span className="ml-2 inline-flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-badge px-1 text-[10px] font-semibold text-white">11</span>
          </span>
        </Row>
        <Row label="RowActions">
          <RowActions>
            {ROW_ACTION_KINDS.map((k) => (
              <RowAction key={k} kind={k} onClick={() => toast(`${k} clicked`)} />
            ))}
          </RowActions>
          <RowActions>
            <RowAction kind="approve" disabled />
            <RowAction kind="delete" disabled />
          </RowActions>
        </Row>
        <Row label="Spinner / loader">
          <Spinner size={16} />
          <Spinner />
          <Spinner size={32} />
          <div className="w-40 rounded-card border border-line">
            <PageLoader />
          </div>
        </Row>
        <Row label="EmptyState">
          <div className="w-full rounded-card border border-line">
            <EmptyState hint="Try changing the filters" />
          </div>
        </Row>
        <Row label="Popover">
          <Popover trigger={({ toggle, open }) => <Button variant="outline" onClick={toggle}>{open ? 'Close' : 'Open'} popover</Button>}>
            {(close) => (
              <div className="p-3 text-sm text-ink-cell">
                Popover content
                <button type="button" className="ml-3 text-primary underline" onClick={close}>
                  close
                </button>
              </div>
            )}
          </Popover>
        </Row>
        <Row label="Toasts">
          <Button size="sm" onClick={() => toast.success('Saved successfully')}>
            success
          </Button>
          <Button size="sm" variant="danger" onClick={() => toast.error('Something went wrong')}>
            error
          </Button>
          <Button size="sm" variant="outline" onClick={() => toast('Plain message')}>
            info
          </Button>
        </Row>
      </Section>

      {/* ---------------------------------------------------------------- table */}
      <ListCard>
        <DataTable<MockRow>
          title="Item List (mock data)"
          toolbar={
            <>
              <Button size="sm" variant="outline" onClick={() => setEmptyTable((v) => !v)}>
                {emptyTable ? 'Show rows' : 'Empty state'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setLoadingTable((v) => !v)}>
                {loadingTable ? 'Stop loading' : 'Loading state'}
              </Button>
            </>
          }
          columns={MOCK_COLUMNS}
          data={rows}
          loading={loadingTable}
          page={page}
          pageSize={pageSize}
          total={total}
          pages={pages}
          onPageChange={setPage}
          onPageSizeChange={(s) => {
            setPageSize(s)
            setPage(1)
          }}
          sort={sort}
          onSortChange={(s) => {
            setSort(s)
            setPage(1)
          }}
          filters={filters}
          onFilterChange={(k, v) => {
            setFilters((f) => ({ ...f, [k]: v }))
            setPage(1)
          }}
          rowKey={(r) => r.id}
          actions={(r) => (
            <RowActions>
              <RowAction kind="view" onClick={() => setDetail(true)} />
              <RowAction kind="edit" onClick={() => toast(`Edit ${r.code}`)} />
              {r.workflow === 'pending' && <RowAction kind="approve" onClick={() => setConfirm('approve')} />}
              {r.workflow === 'pending' && <RowAction kind="back" onClick={() => setComment('back')} />}
              <RowAction kind="delete" onClick={() => setConfirm('danger')} />
            </RowActions>
          )}
          actionsWidth={200}
          minWidth={1000}
        />
      </ListCard>

      <Section title="Pagination (standalone)" hint='"Showing 1 to 10 of 23 results" · « ‹ 1 2 3 › » · page jump + Go · Rows per page'>
        <Pagination page={page} pageSize={pageSize} total={total} pages={pages} onPageChange={setPage} onPageSizeChange={setPageSize} />
      </Section>

      {/* ---------------------------------------------------------------- modals */}
      <Section title="Modals & dialogs" hint="DetailModal (Item Details) · ConfirmDialog (warning / approve / danger) · CommentDialog (Demand Back / Forwarded) · ObsoleteRequestModal · plain Modal">
        <Row label="DetailModal">
          <Button variant="outline" onClick={() => setDetail(true)}>
            Item Details (GRN spec)
          </Button>
          <Button variant="outline" onClick={() => setDetailFull(true)}>
            Item Details (image + info + spec)
          </Button>
        </Row>
        <Row label="ConfirmDialog">
          <Button variant="outline" onClick={() => setConfirm('warning')}>
            Are you sure? (warning)
          </Button>
          <Button variant="outline" onClick={() => setConfirm('approve')}>
            Approve (check icon)
          </Button>
          <Button variant="outline" onClick={() => setConfirm('danger')}>
            Delete (danger)
          </Button>
        </Row>
        <Row label="CommentDialog">
          <Button variant="outline" onClick={() => setComment('back')}>
            Demand Back
          </Button>
          <Button variant="outline" onClick={() => setComment('forward')}>
            Demand Forwarded
          </Button>
        </Row>
        <Row label="ObsoleteRequestModal">
          <Button variant="outline" onClick={() => setObsolete(true)}>
            Obsolete Request
          </Button>
        </Row>
        <Row label="Modal (base)">
          <Button variant="outline" onClick={() => setPlain(true)}>
            Plain modal
          </Button>
        </Row>
      </Section>

      <DetailModal
        open={detail}
        onClose={() => setDetail(false)}
        title="Item Details"
        sections={[
          {
            title: 'Specification',
            rows: [
              { label: 'GRN No', value: '0725.82647' },
              { label: 'Transaction Date', value: '29/07/2025 02:20 PM' },
              { label: 'IMC', value: 'A.C. 0013.00374.0000' },
              { label: 'Item Name', value: 'Clamp, Air Cleaner' },
              { label: 'Deno', value: 'No' },
              { label: 'Receive Quantity', value: '2' },
              { label: 'Part No', value: '11000615' },
              { label: 'Remarks', value: 'Meter' },
            ],
          },
          {
            title: 'Item Info',
            rows: [
              { label: 'Title of Item', value: 'Rope, Polyester, Cir: 1inch Dia: 8mm' },
              { label: 'IMC/Spec', value: '55.114' },
              { label: 'Deno', value: 'Meter | Acct Status : Quasi Permanent | Item Type : Other' },
              { label: 'Group', value: 'D | Sub Group : Quasi Permanent | Directorate : DNS' },
            ],
          },
        ]}
      />
      <DetailModal
        open={detailFull}
        onClose={() => setDetailFull(false)}
        title="Item Details"
        sections={[
          {
            title: 'Item Image',
            content: (
              <div className="flex gap-5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-[102px] w-[102px] rounded-[6px] bg-[#E8E4E4]" />
                ))}
              </div>
            ),
          },
          {
            title: 'Item Info',
            rows: [
              { label: 'Title of Item', value: 'Rope, Polyester, Cir: 1inch Dia: 8mm' },
              { label: 'IMC/Spec', value: '55.114' },
            ],
          },
          {
            title: 'Specification',
            columns: 2,
            rows: [
              { label: 'GRN No', value: '0725.82647' },
              { label: 'IMC', value: 'A.C. 0013.00374.0000' },
              { label: 'Item Name', value: 'Clamp, Air Cleaner' },
              { label: 'Deno', value: 'No' },
            ],
          },
        ]}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="dark" icon={<Printer size={16} />}>
              Print
            </Button>
            <Button variant="danger" icon={<Download size={18} />}>
              Download
            </Button>
          </div>
        }
      />
      <ConfirmDialog
        open={!!confirm}
        tone={confirm ?? 'warning'}
        onClose={() => setConfirm(null)}
        loading={busy}
        message={confirm === 'approve' ? 'You want to Approve this!' : confirm === 'danger' ? 'You want to delete this Item!' : 'You want to cancel this demand!'}
        onConfirm={() => {
          setBusy(true)
          setTimeout(() => {
            setBusy(false)
            setConfirm(null)
            toast.success('Done')
          }, 800)
        }}
      />
      <CommentDialog
        open={!!comment}
        onClose={() => setComment(null)}
        title={comment === 'forward' ? 'Demand Forwarded' : 'Demand Back'}
        onConfirm={(c) => {
          toast.success(`Comment: ${c}`)
          setComment(null)
        }}
      />
      <ObsoleteRequestModal open={obsolete} onClose={() => setObsolete(false)} data={sampleObsoleteRequest} onDownload={() => toast('Download request')} />
      <Modal open={plain} onClose={() => setPlain(false)} width={480}>
        <div className="p-6">
          <h3 className="text-lg font-medium text-primary">Plain modal</h3>
          <p className="mt-2 text-sm text-ink-cell">Base Modal: portal, backdrop, Escape to close, 92vh max height, scale-in animation.</p>
          <div className="mt-6 flex justify-end">
            <Button variant="outline" onClick={() => setPlain(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
