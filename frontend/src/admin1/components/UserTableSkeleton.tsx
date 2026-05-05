/**
src/admin1/components/UserTableSkeleton.tsx
 * Loading skeleton for the user management table.
 * Provides visual feedback while data is fetching.
 */

import React from 'react'

const UserTableSkeleton: React.FC = () => {
  const rows = Array.from({ length: 7 }, (_, i) => i)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {['Matric No', 'Full Name', 'Email', 'Level', 'Role', 'Status', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-3 text-left">
                  <div className="h-3.5 w-20 bg-gray-200 rounded animate-pulse" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((i) => (
              <tr key={i} className={i < rows.length - 1 ? 'border-b border-gray-50' : ''}>
                <td className="px-4 py-4"><div className="h-3.5 w-24 bg-gray-200 rounded animate-pulse" /></td>
                <td className="px-4 py-4"><div className="h-3.5 w-32 bg-gray-200 rounded animate-pulse" /></td>
                <td className="px-4 py-4"><div className="h-3.5 w-40 bg-gray-200 rounded animate-pulse" /></td>
                <td className="px-4 py-4"><div className="h-3.5 w-12 bg-gray-200 rounded animate-pulse" /></td>
                <td className="px-4 py-4"><div className="h-5 w-16 bg-gray-200 rounded-full animate-pulse" /></td>
                <td className="px-4 py-4"><div className="h-5 w-20 bg-gray-200 rounded-full animate-pulse" /></td>
                <td className="px-4 py-4"><div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default UserTableSkeleton