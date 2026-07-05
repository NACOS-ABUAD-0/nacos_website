// src/admin1/pages/Settings.tsx

import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import { Footer } from '../../components/Footer'
import { useAuth } from '../../context/AuthContext'
import { authAPI } from '../../lib/api'

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  user: 'User',
}

// ── Types ──────────────────────────────────────────────────────
interface FieldProps {
  label: string
  children: React.ReactNode
}

interface PasswordFieldProps {
  label: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  hint?: string
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode
}

// ── Reusable row ───────────────────────────────────────────────
const Field: React.FC<FieldProps> = ({ label, children }) => (
  <div className="flex flex-col sm:flex-row sm:items-start gap-3 py-5 border-b border-gray-100 last:border-0">
    <span className="text-[13px] font-medium text-gray-700 sm:w-56 shrink-0 pt-2">{label}</span>
    <div className="flex-1">{children}</div>
  </div>
)

// ── Password row ───────────────────────────────────────────────
const PasswordField: React.FC<PasswordFieldProps> = ({ label, value, onChange, hint }) => {
  const [show, setShow] = useState<boolean>(false)
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-3 py-5 border-b border-gray-100 last:border-0">
      <span className="text-[13px] font-medium text-gray-700 sm:w-56 shrink-0 pt-2">{label}</span>
      <div className="flex-1">
        <div className="relative">
          <input
            type={show ? 'text' : 'password'}
            value={value}
            onChange={onChange}
            placeholder="••••••••"
            className="w-full border border-gray-200 rounded-lg text-[13px] text-gray-700 py-2.5 pl-3 pr-10 focus:outline-none focus:border-[#1a7a3f] transition-colors bg-white"
          />
          <button
            type="button"
            onClick={() => setShow((p) => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {show ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
        {hint && <p className="text-[11px] text-gray-400 mt-1.5">{hint}</p>}
      </div>
    </div>
  )
}

const Input: React.FC<InputProps> = ({ icon, ...props }) => (
  <div className="relative">
    {icon && (
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>
    )}
    <input
      {...props}
      className={`w-full border border-gray-200 rounded-lg text-[13px] text-gray-700 py-2.5 pr-3 focus:outline-none focus:border-[#1a7a3f] transition-colors bg-white ${icon ? 'pl-9' : 'pl-3'} ${props.disabled ? 'bg-gray-50 text-gray-400' : ''}`}
    />
  </div>
)

// ── My Details Tab ─────────────────────────────────────────────
const MyDetails: React.FC = () => {
  const { user, updateProfile } = useAuth()
  const [fullName, setFullName] = useState<string>(user?.full_name ?? '')
  const [saving, setSaving] = useState<boolean>(false)

  useEffect(() => {
    setFullName(user?.full_name ?? '')
  }, [user])

  const handleSave = async (): Promise<void> => {
    setSaving(true)
    try {
      await updateProfile({ full_name: fullName })
      toast.success('Profile updated!')
    } catch {
      toast.error('Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between pb-6 border-b border-gray-100 mb-2">
        <div>
          <h2 className="text-[15px] font-semibold text-gray-900">Personal info</h2>
          <p className="text-[12px] text-gray-400 mt-0.5">Update your name here.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 text-[13px] font-semibold text-white bg-[#1a7a3f] hover:bg-[#155f32] rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      <Field label="Name">
        <Input
          placeholder="Full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
      </Field>

      <Field label="Email address">
        <Input value={user?.email ?? ''} disabled />
      </Field>

      <Field label="Role">
        <Input value={ROLE_LABELS[user?.role ?? ''] ?? user?.role ?? ''} disabled />
      </Field>
    </div>
  )
}

// ── Password Tab ───────────────────────────────────────────────
const Password: React.FC = () => {
  const [current, setCurrent] = useState<string>('')
  const [newPass, setNewPass] = useState<string>('')
  const [confirm, setConfirm] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<boolean>(false)
  const [saving, setSaving] = useState<boolean>(false)

  const handleUpdate = async (): Promise<void> => {
    if (newPass.length < 8) { setError('Your new password must be at least 8 characters.'); return }
    if (newPass !== confirm) { setError('Passwords do not match.'); return }
    setError('')
    setSaving(true)
    try {
      await authAPI.changePassword(current, newPass, confirm)
      setSuccess(true)
      setCurrent(''); setNewPass(''); setConfirm('')
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      const data = err?.response?.data
      const message =
        data?.current_password?.[0] ??
        data?.new_password?.[0] ??
        data?.detail ??
        'Failed to change password.'
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="pb-6 border-b border-gray-100 mb-2">
        <h2 className="text-[16px] font-bold text-gray-900">Password</h2>
        <p className="text-[13px] text-gray-400 mt-1">Please enter your current password to change your password.</p>
      </div>

      <PasswordField label="Current password" value={current} onChange={(e) => setCurrent(e.target.value)} />
      <PasswordField
        label="New password"
        value={newPass}
        onChange={(e) => { setNewPass(e.target.value); setError('') }}
        hint={error || 'Your new password must be at least 8 characters.'}
      />
      <PasswordField label="Confirm new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />

      {success && (
        <p className="text-[12px] text-[#1a7a3f] font-medium mt-3">Password updated successfully ✓</p>
      )}

      <div className="flex justify-end mt-6 pb-6 border-b border-gray-100">
        <button
          onClick={handleUpdate}
          disabled={saving}
          className="px-5 py-2.5 bg-[#1a7a3f] hover:bg-[#155f32] text-white text-[13px] font-semibold rounded-lg transition-colors disabled:opacity-50"
        >
          {saving ? 'Updating…' : 'Update Password'}
        </button>
      </div>
    </div>
  )
}

// ── Main Settings Page ─────────────────────────────────────────
export default function Settings(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<'details' | 'password'>('details')

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 md:px-6 py-10">
        <div className="flex gap-8 border-b border-gray-200 mb-8">
          {([
            { id: 'details', label: 'My details' },
            { id: 'password', label: 'Password' },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-[14px] font-medium transition-colors relative ${
                activeTab === tab.id
                  ? 'text-[#1a7a3f]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#1a7a3f] rounded-full" />
              )}
            </button>
          ))}
        </div>

        {activeTab === 'details' && <MyDetails />}
        {activeTab === 'password' && <Password />}
      </main>

      <Footer />
    </div>
  )
}
