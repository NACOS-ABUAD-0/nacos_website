// src/lib/hooks/useRoles.ts
//
// The role catalog: fixed system roles plus the executive titles the Super
// Admin manages. Used by the assign-role and role-filter dropdowns.

import { useQuery } from '@tanstack/react-query'
import { fetchRoles, type RoleCatalog, type RoleOption } from '../../services/adminUserService'

export const ROLES_QUERY_KEY = ['admin-roles']

export const useRoles = () =>
  useQuery<RoleCatalog>({
    queryKey: ROLES_QUERY_KEY,
    queryFn: fetchRoles,
    staleTime: 5 * 60 * 1000,
  })

/** Grouped options for an assign-role <select>, executive titles first. */
export const useRoleOptionGroups = (): { label: string; roles: RoleOption[] }[] => {
  const { data } = useRoles()
  if (!data) return []
  return [
    { label: 'Executive Roles', roles: data.executive },
    { label: 'Staff', roles: data.system.filter((r) => r.value !== 'student') },
    { label: 'Basic', roles: data.system.filter((r) => r.value === 'student') },
  ]
}
