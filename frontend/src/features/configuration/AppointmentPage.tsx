/** Configuration › Appointment (Figma 02_Configuration - Appointment). Table column "Designation" = appointment name. */
import { z } from 'zod'
import type { ColumnDef } from '@tanstack/react-table'
import { CrudPage, type FieldSpec } from '@/components/crud/CrudPage'
import { StatusText } from '@/components/ui/Misc'
import { fmtDateTime, STATUS_OPTIONS } from '@/lib/utils'
import type { Status } from '@/types/api'
import { appointmentsApi, type Appointment, type AppointmentInput } from './api'

const schema = z.object({
  name: z.string().trim().min(1, 'Appointment Name is required').max(150),
  status: z.enum(['active', 'inactive']),
})
type FormValues = z.infer<typeof schema>

const fields: FieldSpec<FormValues>[] = [
  { name: 'name', label: 'Appointment Name', type: 'text', required: true, placeholder: '--' },
  { name: 'status', label: 'Status', type: 'status' },
]

const columns: ColumnDef<Appointment, unknown>[] = [
  { id: 'name', header: 'Designation', accessorKey: 'name', meta: { sortKey: 'name', filterKey: 'name' } },
  {
    id: 'status',
    header: 'Status',
    accessorKey: 'status',
    cell: ({ getValue }) => <StatusText status={getValue<Status>()} />,
    meta: { sortKey: 'status', filterKey: 'status', filterOptions: [...STATUS_OPTIONS] },
  },
]

export default function AppointmentPage() {
  return (
    <CrudPage<Appointment, FormValues, AppointmentInput>
      title="Appointment"
      listTitle="Appointment Name"
      module="configuration"
      queryKey="config-appointments"
      api={appointmentsApi}
      entityLabel="Appointment"
      fields={fields}
      schema={schema}
      defaultValues={{ name: '', status: 'active' }}
      columns={columns}
      toForm={(r) => ({ name: r.name, status: r.status })}
      detailTitle="Appointment Details"
      toDetail={(r) => [
        {
          title: 'Appointment Information',
          rows: [
            { label: 'Designation', value: r.name },
            { label: 'Status', value: <StatusText status={r.status} /> },
            { label: 'Created', value: fmtDateTime(r.created_at) },
          ],
        },
      ]}
      minTableWidth={700}
    />
  )
}
