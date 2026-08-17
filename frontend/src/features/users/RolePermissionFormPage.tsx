/**
 * User Management › Role Permission › Create Role / Edit (Figma variants B + C).
 * CollapsibleCard "Role Permission": Role Name* → "Assign Permission" matrix (all modules from GET /modules) →
 * Clear All / Save. Save = POST /roles (create) or PUT /roles/:id (edit) with name + permissions, then back to the list.
 */
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CheckCircle2, Eraser } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { CollapsibleCard, Fieldset, FormActions, FormField } from '@/components/ui/Form'
import { Input } from '@/components/ui/Input'
import { Badge, PageLoader } from '@/components/ui/Misc'
import { useAuthStore } from '@/app/store/auth'
import { errorMessage } from '@/lib/utils'
import { fetchModules, matrixToPermissions, roleToMatrix, rolesApi, type Matrix, type Role } from './api'
import { PermissionMatrix } from './PermissionMatrix'

const LIST_ROUTE = '/users/role-permission'

export default function RolePermissionFormPage() {
  const { id } = useParams()
  const roleId = id ? Number(id) : null
  const isEdit = roleId !== null && Number.isFinite(roleId)
  const navigate = useNavigate()
  const qc = useQueryClient()
  const hasPermission = useAuthStore((s) => s.hasPermission)
  const canSave = isEdit ? hasPermission('user_management', 'edit') : hasPermission('user_management', 'add')

  const modules = useQuery({ queryKey: ['modules'], queryFn: fetchModules, staleTime: 5 * 60_000 })
  const role = useQuery({ queryKey: ['roles', 'one', roleId], queryFn: () => rolesApi.get(roleId as number), enabled: isEdit })

  const [name, setName] = useState('')
  const [nameError, setNameError] = useState<string | undefined>()
  const [matrix, setMatrix] = useState<Matrix>({})

  // hydrate the form once the role is loaded (edit mode)
  useEffect(() => {
    if (role.data) {
      setName(role.data.name)
      setMatrix(roleToMatrix(role.data))
    }
  }, [role.data])

  const sortedModules = useMemo(() => [...(modules.data ?? [])].sort((a, b) => a.sort_order - b.sort_order), [modules.data])
  const isSystem = !!role.data?.is_system

  const save = useMutation({
    mutationFn: async (): Promise<Role> => {
      const permissions = matrixToPermissions(matrix)
      if (isEdit) {
        const payload = isSystem ? { permissions } : { name: name.trim(), permissions }
        return rolesApi.update(roleId as number, payload)
      }
      return rolesApi.create({ name: name.trim(), permissions })
    },
    onSuccess: (saved) => {
      toast.success(isEdit ? `Role "${saved.name}" updated` : `Role "${saved.name}" created`)
      qc.invalidateQueries({ queryKey: ['roles'] })
      qc.invalidateQueries({ queryKey: ['auth', 'me'] })
      navigate(LIST_ROUTE)
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setNameError('Role Name is required')
      return
    }
    if (name.trim().length > 100) {
      setNameError('Role Name must be at most 100 characters')
      return
    }
    setNameError(undefined)
    save.mutate()
  }

  const clearAll = () => {
    setMatrix({})
    setNameError(undefined)
    if (!isSystem) setName('')
  }

  if (isEdit && role.isLoading) return <PageLoader />
  if (isEdit && role.isError) {
    return (
      <CollapsibleCard title="Role Permission">
        <p className="text-sm text-danger">{errorMessage(role.error, 'Role not found')}</p>
        <Button type="button" variant="outline" className="mt-4" onClick={() => navigate(LIST_ROUTE)}>
          Back to list
        </Button>
      </CollapsibleCard>
    )
  }

  return (
    <CollapsibleCard
      title="Role Permission"
      actions={isEdit && role.data ? <Badge tone={isSystem ? 'grey' : 'orange'}>{isSystem ? 'System role' : `Editing #${role.data.id}`}</Badge> : undefined}
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-[30px]">
        <Fieldset>
          <FormField label="Role Name" required error={nameError} htmlFor="role-name" hint={isSystem ? 'System role names cannot be changed' : undefined}>
            <Input
              id="role-name"
              name="name"
              value={name}
              placeholder="--"
              maxLength={100}
              disabled={isSystem || !canSave}
              invalid={!!nameError}
              onChange={(e) => {
                setName(e.target.value)
                if (nameError) setNameError(undefined)
              }}
              autoComplete="off"
            />
          </FormField>
        </Fieldset>

        {modules.isLoading ? (
          <PageLoader />
        ) : modules.isError ? (
          <p className="text-sm text-danger">{errorMessage(modules.error, 'Failed to load modules')}</p>
        ) : (
          <PermissionMatrix modules={sortedModules} value={matrix} onChange={setMatrix} disabled={!canSave} />
        )}

        <FormActions className="mt-0">
          <Button type="button" variant="clear" icon={<Eraser size={18} />} onClick={clearAll} disabled={save.isPending || !canSave}>
            Clear All
          </Button>
          <Button type="submit" variant="primary" icon={<CheckCircle2 size={16} />} loading={save.isPending} disabled={!canSave || modules.isLoading}>
            Save
          </Button>
        </FormActions>
      </form>
    </CollapsibleCard>
  )
}
