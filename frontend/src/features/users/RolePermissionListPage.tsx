/**
 * User Management › Role Permission (Figma 02_User Management- Role Permission, variant A: list only).
 * Single list card: "Role Permission List" + "Create Role Permission +" (bg #2F4086) → /users/role-permission/create.
 * Columns: SL | Role Name | Status | Action (edit → /users/role-permission/:id/edit, delete).
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ListCard } from '@/components/ui/Form'
import { DataTable } from '@/components/ui/DataTable'
import { ConfirmDialog } from '@/components/ui/Modal'
import { RowAction, RowActions } from '@/components/ui/RowActions'
import { StatusText } from '@/components/ui/Misc'
import { useTableState } from '@/hooks/useTableState'
import { useCrud } from '@/hooks/useCrud'
import { useAuthStore } from '@/app/store/auth'
import type { Status } from '@/types/api'
import { rolesApi, type Role, type RoleInput } from './api'

const columns: ColumnDef<Role, unknown>[] = [
  { id: 'name', header: 'Role Name', accessorKey: 'name', meta: { sortKey: 'name', filterKey: 'name' } },
  {
    id: 'status',
    header: 'Status',
    accessorKey: 'status',
    cell: ({ getValue }) => <StatusText status={getValue<Status>()} />,
    meta: {
      sortKey: 'status',
      filterKey: 'status',
      width: 260,
      filterOptions: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
      ],
    },
  },
]

export default function RolePermissionListPage() {
  const navigate = useNavigate()
  const hasPermission = useAuthStore((s) => s.hasPermission)
  const canAdd = hasPermission('user_management', 'add')
  const canEdit = hasPermission('user_management', 'edit')
  const canDelete = hasPermission('user_management', 'delete')

  const crud = useCrud<Role, RoleInput>('roles', rolesApi)
  const table = useTableState({ sort: 'id:asc' })
  const list = crud.useList(table.query)
  const remove = crud.useRemove()
  const [deleting, setDeleting] = useState<Role | null>(null)

  return (
    <>
      <ListCard>
        <DataTable<Role>
          title={<span className="text-primary">Role Permission List</span>}
          toolbar={
            canAdd ? (
              <Button variant="alt" icon={<Plus size={18} />} onClick={() => navigate('/users/role-permission/create')}>
                Create Role Permission
              </Button>
            ) : undefined
          }
          showColumnsChooser={false}
          columns={columns}
          data={list.data?.items ?? []}
          loading={list.isFetching}
          page={list.data?.page ?? table.state.page}
          pageSize={table.state.pageSize}
          total={list.data?.total ?? 0}
          pages={list.data?.pages ?? 0}
          onPageChange={table.setPage}
          onPageSizeChange={table.setPageSize}
          sort={table.state.sort}
          onSortChange={table.setSort}
          filters={table.state.filters}
          onFilterChange={table.setFilter}
          minWidth={800}
          actionsWidth={250}
          rowKey={(r) => r.id}
          actions={
            canEdit || canDelete
              ? (row) => (
                  <RowActions>
                    {canEdit && <RowAction kind="edit" onClick={() => navigate(`/users/role-permission/${row.id}/edit`)} />}
                    {canDelete && (
                      <RowAction
                        kind="delete"
                        disabled={row.is_system}
                        title={row.is_system ? 'System role cannot be deleted' : 'Delete'}
                        onClick={() => setDeleting(row)}
                      />
                    )}
                  </RowActions>
                )
              : undefined
          }
        />
      </ListCard>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        tone="danger"
        message="You want to delete this Role!"
        loading={remove.isPending}
        onConfirm={async () => {
          if (!deleting) return
          await remove.mutateAsync(deleting.id)
          setDeleting(null)
        }}
      />
    </>
  )
}
