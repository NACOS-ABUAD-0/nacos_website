// src/admin1/pages/EventCheckIn.tsx
import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import { Footer } from '../../components/Footer'
import { useEvent } from '../../lib/hooks/useEvents'
import {
  useEventRegistrations,
  useCheckIn,
  useCheckInByToken,
  type AdminEventRegistration,
} from '../../lib/hooks/useEventAttendance'
import QRScanner from '../../components/QRScanner'

const formatTime = (iso: string): string =>
  new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

const RegistrationRow: React.FC<{
  registration: AdminEventRegistration
  onCheckIn: (id: number) => void
  isChecking: boolean
}> = ({ registration, onCheckIn, isChecking }) => (
  <tr className="border-b border-gray-100">
    <td className="py-3 px-4 text-sm font-medium text-gray-900">{registration.user.full_name}</td>
    <td className="py-3 px-4 text-sm text-gray-500">{registration.user.matric_number ?? '—'}</td>
    <td className="py-3 px-4 text-sm text-gray-500">{registration.user.email}</td>
    <td className="py-3 px-4">
      {registration.checked_in_at ? (
        <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
          Checked in ✓ {formatTime(registration.checked_in_at)}
        </span>
      ) : (
        <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
          Not checked in
        </span>
      )}
    </td>
    <td className="py-3 px-4 text-right">
      <button
        onClick={() => onCheckIn(registration.id)}
        disabled={!!registration.checked_in_at || isChecking}
        className="bg-[#1a7a3f] text-white text-sm px-4 py-1.5 rounded-lg hover:bg-[#155f32] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {registration.checked_in_at ? 'Checked in' : 'Check In'}
      </button>
    </td>
  </tr>
)

const EventCheckIn: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [scannerOpen, setScannerOpen] = useState(false)

  const { data: event } = useEvent(id!)
  const { data: registrations = [], isLoading } = useEventRegistrations(id!, search)
  const checkInMutation = useCheckIn(id!)
  const checkInByTokenMutation = useCheckInByToken(id!)

  const checkedInCount = registrations.filter(r => r.checked_in_at).length

  const handleCheckInResult = (result: { status: string; registration: AdminEventRegistration }) => {
    if (result.status === 'checked_in') {
      toast.success(`Checked in: ${result.registration.user.full_name}`)
    } else {
      toast(`Already checked in: ${result.registration.user.full_name} at ${formatTime(result.registration.checked_in_at!)}`, { icon: 'ℹ️' })
    }
  }

  const handleCheckIn = (registrationId: number) => {
    checkInMutation.mutate(registrationId, {
      onSuccess: handleCheckInResult,
      onError: () => toast.error('Check-in failed. Please try again.'),
    })
  }

  const handleScanSuccess = (token: string) => {
    checkInByTokenMutation.mutate(token, {
      onSuccess: handleCheckInResult,
      onError: () => toast.error('No matching registration found for this event.'),
    })
  }

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <button
          onClick={() => navigate('/admin/events')}
          className="text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          ← Back to Events
        </button>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs px-8 py-7 mb-6">
          <h1 className="text-[26px] font-extrabold text-[#1a7a3f] mb-1">
            {event?.title ?? 'Event Check-in'}
          </h1>
          {event && (
            <p className="text-sm text-gray-500 mb-3">
              {new Date(event.start_time).toLocaleDateString()} · {event.is_remote ? 'Remote' : event.location}
            </p>
          )}
          <p className="text-lg font-semibold text-gray-900">
            {checkedInCount} / {registrations.length} checked in
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs px-6 py-5 mb-6">
          <button
            onClick={() => setScannerOpen(o => !o)}
            className="bg-[#1a7a3f] text-white text-sm px-4 py-2 rounded-lg hover:bg-[#155f32]"
          >
            {scannerOpen ? 'Close Scanner' : 'Scan QR Code'}
          </button>
          {scannerOpen && (
            <div className="mt-4 max-w-sm">
              <QRScanner onScanSuccess={handleScanSuccess} />
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs px-6 py-5">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, matric number, or email…"
            className="border p-2 rounded-lg text-sm w-full mb-4"
          />

          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1a7a3f]" />
            </div>
          ) : registrations.length === 0 ? (
            <p className="text-gray-500 text-center py-10">No registrations yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 text-left">
                    <th className="py-2 px-4 text-xs font-semibold text-gray-500 uppercase">Name</th>
                    <th className="py-2 px-4 text-xs font-semibold text-gray-500 uppercase">Matric No.</th>
                    <th className="py-2 px-4 text-xs font-semibold text-gray-500 uppercase">Email</th>
                    <th className="py-2 px-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="py-2 px-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map(registration => (
                    <RegistrationRow
                      key={registration.id}
                      registration={registration}
                      onCheckIn={handleCheckIn}
                      isChecking={checkInMutation.isPending}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default EventCheckIn
