// src/admin1/components/RoleManagementPanel.tsx

/**
 * Super Admin panel for adding and removing executive titles (President,
 * Editor-in-Chief, ...). Every executive title shares the same permissions;
 * a title can only be removed once nobody holds it.
 */

import React, { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { addExecutiveRole, removeExecutiveRole } from '../../services/adminUserService'
import { ROLES_QUERY_KEY, useRoles } from '../../lib/hooks/useRoles'

type ToastFn = (t: { message: string; type: 'success' | 'error' }) => void

const apiError = (err: unknown, fallback: string): string => {
  const data = (err as { response?: { data?: { error?: string; label?: string[] } } })?.response?.data
  return data?.error ?? data?.label?.[0] ?? fallback
}

const RoleManagementPanel: React.FC<{ onToast: ToastFn }> = ({ onToast }) => {
  const queryClient = useQueryClient()
  const { data, isLoading } = useRoles()
  const [expanded, setExpanded] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)

  const roles = data?.executive ?? []

  const handleAdd = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    const label = newLabel.trim()
    if (!label) return
    setAdding(true)
    try {
      const role = await addExecutiveRole(label)
      await queryClient.invalidateQueries({ queryKey: ROLES_QUERY_KEY })
      setNewLabel('')
      onToast({ message: `${role.label} added.`, type: 'success' })
    } catch (err) {
      onToast({ message: apiError(err, 'Failed to add role.'), type: 'error' })
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async (value: string, label: string): Promise<void> => {
    if (!window.confirm(`Remove the ${label} role?`)) return
    setRemoving(value)
    try {
      await removeExecutiveRole(value)
      await queryClient.invalidateQueries({ queryKey: ROLES_QUERY_KEY })
      onToast({ message: `${label} removed.`, type: 'success' })
    } catch (err) {
      onToast({ message: apiError(err, 'Failed to remove role.'), type: 'error' })
    } finally {
      setRemoving(null)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">Executive Roles</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Add or remove executive titles. All executive roles share the same access. A role can only be removed once nobody holds it.
          </p>
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="px-3 py-2 rounded-lg text-[13px] font-semibold border bg-white border-gray-200 text-gray-600 hover:bg-gray-50 whitespace-nowrap"
        >
          {expanded ? 'Hide' : `Manage (${isLoading ? '…' : roles.length})`}
        </button>
      </div>

      {expanded && (
        <div className="mt-4">
          <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-2 mb-4">
            <input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="New role name, e.g. Director of Innovation"
              maxLength={100}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1a7a3f]"
            />
            <button
              type="submit"
              disabled={adding || !newLabel.trim()}
              className="bg-[#1a7a3f] hover:bg-[#155f32] disabled:opacity-50 text-white text-[13px] font-semibold px-4 py-2 rounded-lg whitespace-nowrap"
            >
              {adding ? 'Adding…' : 'Add Role'}
            </button>
          </form>

          <ul className="divide-y divide-gray-100 border border-gray-100 rounded-lg">
            {roles.map((role) => (
              <li key={role.value} className="flex items-center justify-between gap-3 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm text-gray-800 truncate">{role.label}</p>
                  <p className="text-xs text-gray-400">
                    {role.user_count} {role.user_count === 1 ? 'holder' : 'holders'}
                  </p>
                </div>
                <button
                  onClick={() => handleRemove(role.value, role.label)}
                  disabled={removing !== null || role.user_count > 0}
                  title={role.user_count > 0 ? 'Reassign the holders before removing this role' : undefined}
                  className="text-[13px] font-semibold text-red-600 hover:text-red-700 disabled:text-gray-300 disabled:cursor-not-allowed"
                >
                  {removing === role.value ? 'Removing…' : 'Remove'}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default RoleManagementPanel
