// src/lib/roles.ts
//
// Single source of truth for the account role system. Mirrors
// backend/accounts/models.py's User.Role — keep the two in sync.

export type UserRole =
  | 'user' // legacy default, never shown as an assignable option
  | 'student'
  | 'technician'
  | 'lecturer'
  | 'admin'
  | 'super_admin'
  | 'president'
  | 'vice_president'
  | 'general_secretary'
  | 'asst_general_secretary'
  | 'financial_secretary'
  | 'software_director'
  | 'hardware_director'
  | 'social_director'
  | 'welfare_director'
  | 'academic_director'
  | 'public_relations_officer'
  | 'sports_director'
  | 'chief_of_staff'

export type AccountType = 'student' | 'staff'

// ─── Executive tier ─────────────────────────────────────────────────────────
// Admin-like but restricted: can access/approve committee applications, but
// cannot promote anyone, create attendance, or edit user management.

export const EXECUTIVE_ROLE_VALUES: UserRole[] = [
  'president',
  'vice_president',
  'general_secretary',
  'asst_general_secretary',
  'financial_secretary',
  'software_director',
  'hardware_director',
  'social_director',
  'welfare_director',
  'academic_director',
  'public_relations_officer',
  'sports_director',
  'chief_of_staff',
]

// ─── Labels ─────────────────────────────────────────────────────────────────

export const ROLE_LABELS: Record<UserRole, string> = {
  user: 'User',
  student: 'Student',
  technician: 'Technician',
  lecturer: 'Lecturer',
  admin: 'Admin',
  super_admin: 'Super Admin',
  president: 'President',
  vice_president: 'Vice President',
  general_secretary: 'General Secretary',
  asst_general_secretary: 'Assistant General Secretary',
  financial_secretary: 'Financial Secretary',
  software_director: 'Software Director',
  hardware_director: 'Hardware Director',
  social_director: 'Social Director',
  welfare_director: 'Welfare Director',
  academic_director: 'Academic Director',
  public_relations_officer: 'Public Relations Officer',
  sports_director: 'Sports Director',
  chief_of_staff: 'Chief of Staff',
}

export const roleLabel = (role?: string | null): string =>
  (role && ROLE_LABELS[role as UserRole]) || role || 'User'

// ─── Assignable roles (grouped for the assign-role <select>) ────────────────
// Excludes 'super_admin' (manual/DB-only, never assigned from the UI) and
// the legacy 'user' role (not a meaningful UI target).

export const ROLE_OPTION_GROUPS: { label: string; roles: UserRole[] }[] = [
  {
    label: 'Executive Roles',
    roles: EXECUTIVE_ROLE_VALUES,
  },
  {
    label: 'Staff',
    roles: ['admin', 'lecturer', 'technician'],
  },
  {
    label: 'Basic',
    roles: ['student'],
  },
]

// ─── Capability helpers ──────────────────────────────────────────────────────

/** Admin, Super Admin, or Lecturer — full admin-tier operational permissions. */
export const isFullAdminTier = (role?: string | null): boolean =>
  role === 'admin' || role === 'super_admin' || role === 'lecturer'

/** One of the 13 fixed executive titles — committee-applications-only access. */
export const isExecutiveTier = (role?: string | null): boolean =>
  EXECUTIVE_ROLE_VALUES.includes(role as UserRole)

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
