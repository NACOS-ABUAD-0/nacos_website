// src/admin1/pages/Settings.jsx

import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import { Footer } from '../../components/Footer.tsx'
import profileImg from '../../assets/profile.png'

// Reusable row 
const Field = ({ label, children }) => (
  <div className="flex flex-col sm:flex-row sm:items-start gap-3 py-5 border-b border-gray-100 last:border-0">
    <span className="text-[13px] font-medium text-gray-700 sm:w-56 shrink-0 pt-2">{label}</span>
    <div className="flex-1">{children}</div>
  </div>
)

// Password row
const PasswordField = ({ label, value, onChange, hint }) => {
  const [show, setShow] = useState(false)
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

const Input = ({ icon, ...props }) => (
  <div className="relative">
    {icon && (
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>
    )}
    <input
      {...props}
      className={`w-full border border-gray-200 rounded-lg text-[13px] text-gray-700 py-2.5 pr-3 focus:outline-none focus:border-[#1a7a3f] transition-colors bg-white ${icon ? 'pl-9' : 'pl-3'}`}
    />
  </div>
)

// Session device row 
const SessionRow = ({ device, location, time, active }) => (
  <div className="flex items-start gap-4 py-4 border-b border-gray-100 last:border-0">
    <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
      <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    </div>
    <div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[13px] font-medium text-gray-800">{device}</span>
        {active && (
          <span className="flex items-center gap-1 bg-white border border-green-300 text-green-600 text-[11px] font-medium px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            Active now
          </span>
        )}
      </div>
      <p className="text-[12px] text-gray-400 mt-0.5">{location} • {time}</p>
    </div>
  </div>
)

//  My Details Tab 
const MyDetails = () => {
  const fileRef = useRef(null)
  const [photo, setPhoto] = useState(profileImg)
  const [form, setForm] = useState({
    firstName: 'Oliva',
    lastName:  'Rhye',
    email:     'olivia@untitledui.com',
    role:      'Admin',
    level:     '400',
  })
  const [saved, setSaved] = useState(false)

  const handlePhoto = (e) => {
    const file = e.target.files?.[0]
    if (file) setPhoto(URL.createObjectURL(file))
  }

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div>
      {/* Section header + Cancel / Save */}
      <div className="flex items-start justify-between pb-6 border-b border-gray-100 mb-2">
        <div>
          <h2 className="text-[15px] font-semibold text-gray-900">Personal info</h2>
          <p className="text-[12px] text-gray-400 mt-0.5">Update your photo and personal details here.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button className="px-4 py-2 text-[13px] font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-[13px] font-semibold text-white bg-[#1a7a3f] hover:bg-[#155f32] rounded-lg transition-colors"
          >
            {saved ? 'Saved ✓' : 'Save'}
          </button>
        </div>
      </div>

      {/* Your photo — label + subtitle on left, image on right */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-3 py-5 border-b border-gray-100">
        <div className="sm:w-56 shrink-0">
          <p className="text-[13px] font-medium text-gray-700">Your photo</p>
          <p className="text-[12px] text-gray-400 mt-0.5">This will be displayed on your profile.</p>
        </div>
        <div className="flex-1 flex items-center">
          {/* Profile image with Edit overlay */}
          <div className="relative w-16 h-16 group cursor-pointer" onClick={() => fileRef.current?.click()}>
            <img
              src={photo}
              alt="Profile"
              className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
            />
            {/* Edit overlay on hover */}
            <div className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-white text-[10px] font-semibold">Edit</span>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          </div>
        </div>
      </div>

      {/* Name */}
      <Field label="Name">
        <div className="grid grid-cols-2 gap-3">
          <Input
            placeholder="First name"
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
          />
          <Input
            placeholder="Last name"
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
          />
        </div>
      </Field>

      {/* Email */}
      <Field label="Email address">
        <Input
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          }
        />
      </Field>

      {/* Role */}
      <Field label="Role">
        <Input
          placeholder="Role"
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
        />
      </Field>

      {/* Level */}
      <Field label="Level">
        <div className="relative">
          <select
            value={form.level}
            onChange={(e) => setForm({ ...form, level: e.target.value })}
            className="w-full appearance-none border border-gray-200 rounded-lg text-[13px] text-gray-700 py-2.5 pl-3 pr-8 focus:outline-none focus:border-[#1a7a3f] transition-colors bg-white cursor-pointer"
          >
            {[100, 200, 300, 400, 500].map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </Field>
    </div>
  )
}

// Password Tab 
const Password = () => {
  const [current, setCurrent] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState(false)

  const handleUpdate = () => {
    if (newPass.length < 8) { setError('Your new password must be more than 8 characters.'); return }
    if (newPass !== confirm)  { setError('Passwords do not match.'); return }
    setError(''); setSuccess(true)
    setCurrent(''); setNewPass(''); setConfirm('')
    setTimeout(() => setSuccess(false), 3000)
  }

  return (
    <div>
      {/* Header */}
      <div className="pb-6 border-b border-gray-100 mb-2">
        <h2 className="text-[16px] font-bold text-gray-900">Password</h2>
        <p className="text-[13px] text-gray-400 mt-1">Please enter your current password to change your password.</p>
      </div>

      {/* Password fields */}
      <PasswordField
        label="Current password"
        value={current}
        onChange={(e) => setCurrent(e.target.value)}
      />
      <PasswordField
        label="New password"
        value={newPass}
        onChange={(e) => { setNewPass(e.target.value); setError('') }}
        hint={error || 'Your new password must be more than 8 characters.'}
      />
      <PasswordField
        label="Confirm new password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
      />

      {/* Success */}
      {success && (
        <p className="text-[12px] text-[#1a7a3f] font-medium mt-3">Password updated successfully ✓</p>
      )}

      {/* Update button*/}
      <div className="flex justify-end mt-6 pb-6 border-b border-gray-100">
        <button
          onClick={handleUpdate}
          className="px-5 py-2.5 bg-[#1a7a3f] hover:bg-[#155f32] text-white text-[13px] font-semibold rounded-lg transition-colors"
        >
          Update Password
        </button>
      </div>

      {/* Where you're logged in */}
      <div className="mt-8">
        <div className="flex items-start justify-between mb-1">
          <div>
            <h3 className="text-[15px] font-bold text-gray-900">Where you're logged in</h3>
            <p className="text-[12px] text-gray-500 mt-1">
              We'll alert you via{' '}
              <span className="text-[#1a7a3f] font-medium">olivia@untitledui.com</span>
              {' '}if there is any unusual activity on your account.
            </p>
          </div>
          <button className="text-gray-400 hover:text-gray-600 p-1 mt-0.5">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="5"  r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="12" cy="19" r="1.5" />
            </svg>
          </button>
        </div>

        <div className="mt-4">
          <SessionRow device="2018 Macbook Pro 15-inch" location="Melbourne, Australia" time="22 Jan at 10:40am" active />
          <SessionRow device="2018 Macbook Pro 15-inch" location="Melbourne, Australia" time="22 Jan at 4:20pm"  active={false} />
        </div>
      </div>
    </div>
  )
}

// Main Settings Page 
export default function Settings() {
  const [activeTab, setActiveTab] = useState('details')

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 md:px-6 py-10">

        {/* Tabs */}
        <div className="flex gap-8 border-b border-gray-200 mb-8">
          {[
            { id: 'details',  label: 'My details' },
            { id: 'password', label: 'Password' },
          ].map((tab) => (
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

        {activeTab === 'details'  && <MyDetails />}
        {activeTab === 'password' && <Password />}

      </main>

      <Footer />
    </div>
  )
}