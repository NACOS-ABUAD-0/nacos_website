/**
src/admin1/components/DeleteConfirmationModal.tsx
 * Secure Delete Confirmation Modal
 *
 * Requires admin to manually type the target user's exact matric number
 * and full name before enabling the delete button.
 */

import React, { useState, useEffect, useCallback } from 'react'

export interface DeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (matricNumber: string, fullName: string) => void
  targetUser: {
    id: number
    full_name: string
    matric_number: string | null
    email: string
  } | null
  isDeleting: boolean
  error: string | null
}

const DeleteConfirmationModal: React.FC<DeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  targetUser,
  isDeleting,
  error,
}) => {
  const [matricInput, setMatricInput] = useState<string>('')
  const [nameInput, setNameInput] = useState<string>('')
  const [touched, setTouched] = useState<{ matric: boolean; name: boolean }>({
    matric: false,
    name: false,
  })

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setMatricInput('')
      setNameInput('')
      setTouched({ matric: false, name: false })
    }
  }, [isOpen])

  const canSubmit = matricInput.trim().length > 0 && nameInput.trim().length > 0

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit || !targetUser) return
    onConfirm(matricInput.trim(), nameInput.trim())
  }, [canSubmit, targetUser, matricInput, nameInput, onConfirm])

  const handleClose = useCallback(() => {
    if (isDeleting) return // Prevent closing while deleting
    onClose()
  }, [isDeleting, onClose])

  if (!isOpen || !targetUser) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="bg-red-50 px-6 py-4 border-b border-red-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Delete User Account</h3>
              <p className="text-sm text-gray-500">This action is permanent and cannot be undone.</p>
            </div>
          </div>
        </div>

        {/* Warning Banner */}
        <div className="mx-6 mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-3">
          <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9.303 3.376c-.866 1.5.217 3.374 1.948 3.374H14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <p className="text-sm text-amber-800 leading-relaxed">
            To confirm deletion, you must enter the target user's exact matric number and full name.
            This action is <span className="font-bold">irreversible</span>.
          </p>
        </div>

        {/* Target User Info */}
        <div className="mx-6 mt-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Target User</p>
          <div className="space-y-1">
            <p className="text-sm text-gray-900 font-medium">{targetUser.full_name}</p>
            <p className="text-sm text-gray-600">{targetUser.email}</p>
            <p className="text-sm text-gray-600 font-mono">{targetUser.matric_number || 'No matric number'}</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="confirm-matric" className="block text-sm font-medium text-gray-700 mb-1.5">
              Target User's Matric Number <span className="text-red-500">*</span>
            </label>
            <input
              id="confirm-matric"
              type="text"
              value={matricInput}
              onChange={(e) => setMatricInput(e.target.value)}
              onBlur={() => setTouched(prev => ({ ...prev, matric: true }))}
              placeholder="e.g. 23/SCI01/002"
              disabled={isDeleting}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors"
              autoComplete="off"
            />
            {touched.matric && !matricInput.trim() && (
              <p className="mt-1 text-xs text-red-600">Matric number is required</p>
            )}
          </div>

          <div>
            <label htmlFor="confirm-name" className="block text-sm font-medium text-gray-700 mb-1.5">
              Target User's Full Name <span className="text-red-500">*</span>
            </label>
            <input
              id="confirm-name"
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onBlur={() => setTouched(prev => ({ ...prev, name: true }))}
              placeholder="Enter exact full name"
              disabled={isDeleting}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors"
              autoComplete="off"
            />
            {touched.name && !nameInput.trim() && (
              <p className="mt-1 text-xs text-red-600">Full name is required</p>
            )}
          </div>

          {/* Backend Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isDeleting}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit || isDeleting}
              className="flex-1 px-4 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-red-300 transition-colors flex items-center justify-center gap-2"
            >
              {isDeleting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Deleting...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Confirm Delete
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default DeleteConfirmationModal