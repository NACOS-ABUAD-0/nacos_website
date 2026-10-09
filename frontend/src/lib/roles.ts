// src/lib/roles.ts
//
// Single source of truth for the account role system. Mirrors
// backend/accounts/models.py's User.Role — keep the two in sync.

// System roles are fixed. Executive titles (President, Software Director,
// Editor-in-Chief, ...) live in the backend's ExecutiveRole table — the Super
// Admin adds/removes them — so a role is any string. Fetch the current list
// with useRoles() (lib/hooks/useRoles.ts).

export type SystemRole =
  | 'user' // legacy default, never shown as an assignable option
  | 'student'
  | 'technician'
  | 'lecturer'
  | 'admin'
  | 'super_admin'

export type UserRole = SystemRole | (string & {})

export type AccountType = 'student' | 'staff'

// ─── Labels ─────────────────────────────────────────────────────────────────

export const SYSTEM_ROLE_LABELS: Record<SystemRole, string> = {
  user: 'User',
  student: 'Student',
  technician: 'Technician',
  lecturer: 'Lecturer',
  admin: 'Admin',
  super_admin: 'Super Admin',
}

const isSystemRole = (role: string): role is SystemRole => role in SYSTEM_ROLE_LABELS

/**
 * Display name for a role. Pass the backend's `role_label` when you have it
 * (user payloads include it); otherwise executive slugs are title-cased.
 */
export const roleLabel = (role?: string | null, label?: string | null): string => {
  if (label) return label
  if (!role) return 'User'
  if (isSystemRole(role)) return SYSTEM_ROLE_LABELS[role]
  return role.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

// ─── Capability helpers ──────────────────────────────────────────────────────

/** Admin, Super Admin, or Lecturer — full admin-tier operational permissions. */
export const isFullAdminTier = (role?: string | null): boolean =>
  role === 'admin' || role === 'super_admin' || role === 'lecturer'

/**
 * An executive title — committee-applications-only access. Every role that
 * isn't a system role is an executive title (the backend refuses to delete
 * an executive role while anyone still holds it).
 */
export const isExecutiveTier = (role?: string | null): boolean =>
  !!role && !isSystemRole(role)

/** Can this role open the admin dashboard at all? */
export const isStaffAreaRole = (role?: string | null): boolean =>
  isFullAdminTier(role) || isExecutiveTier(role)

/** Only Admin/Super Admin may assign/reassign roles (mirrors CanAssignRoles on the backend). */
export const canAssignRoles = (role?: string | null): boolean =>
  role === 'admin' || role === 'super_admin'

// ─── Badge colors (Tailwind classes) ─────────────────────────────────────────

export const roleBadgeClass = (role?: string | null): string => {
  if (role === 'super_admin') return 'bg-amber-100 text-amber-700 border-amber-200'
  if (role === 'admin') return 'bg-purple-100 text-purple-700 border-purple-200'
  if (role === 'lecturer') return 'bg-blue-100 text-blue-700 border-blue-200'
  if (isExecutiveTier(role)) return 'bg-teal-100 text-teal-700 border-teal-200'
  if (role === 'technician') return 'bg-orange-100 text-orange-700 border-orange-200'
  if (role === 'student') return 'bg-gray-100 text-gray-600 border-gray-200'
  return 'bg-gray-100 text-gray-600 border-gray-200'
}
