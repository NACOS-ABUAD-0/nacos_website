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
import BackCameraScanner from '../../components/BackCameraScanner'

const formatTime = (iso: string): string =>
  new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

// What the gate staff see after each scan.
type ScanOutcome =
  | { kind: 'success'; registration: AdminEventRegistration }
  | { kind: 'already'; registration: AdminEventRegistration }
  | { kind: 'failed'; title: string; reason: string; registration?: AdminEventRegistration }

type ScanErrorBody = { status?: string; detail?: string; registration?: AdminEventRegistration }

const scanFailure = (error: unknown): ScanOutcome => {
  const response = (error as { response?: { status?: number; data?: ScanErrorBody } })?.response
  const data = response?.data
  if (data?.status === 'not_paid') {
    return { kind: 'failed', title: 'Not paid', reason: "This ticket's payment hasn't gone through, so it can't be used yet.", registration: data.registration }
  }
  if (data?.status === 'wrong_event') return { kind: 'failed', title: 'Wrong event', reason: data.detail ?? 'This ticket is for a different event.' }
  if (response?.status === 404) return { kind: 'failed', title: 'Invalid ticket', reason: data?.detail ?? "This QR code isn't a valid ticket for this event." }
  if (!response) return { kind: 'failed', title: 'No connection', reason: "Couldn't reach the server. Check the internet connection and scan again." }
  return { kind: 'failed', title: 'Check-in failed', reason: data?.detail ?? 'Something went wrong. Please scan again.' }
}

const TicketDetails: React.FC<{ registration: AdminEventRegistration }> = ({ registration }) => (
  <div className="mt-3">
    <p className="text-xl font-bold">{registration.name}</p>
    {registration.ticket_type && (
      <p className="mt-1 text-sm font-semibold uppercase tracking-wide opacity-90">
        {registration.ticket_type.name}
        {registration.ticket_type.venue ? ` · ${registration.ticket_type.venue}` : ''}
      </p>
    )}
  </div>
)

const ScanResult: React.FC<{ outcome: ScanOutcome; onNext: () => void; onDone: () => void }> = ({ outcome, onNext, onDone }) => {
  const style = {
    success: { box: 'bg-green-600', icon: '✓', title: 'Checked in' },
    already: { box: 'bg-amber-500', icon: '!', title: 'Already checked in' },
    failed: { box: 'bg-red-600', icon: '✕', title: outcome.kind === 'failed' ? outcome.title : '' },
  }[outcome.kind]

  return (
    <div className="w-full max-w-md mx-auto" role="status" aria-live="assertive">
      <div className={`${style.box} text-white rounded-2xl px-6 py-8 text-center shadow-lg`}>
        <div className="mx-auto w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-4xl font-bold">
          {style.icon}
        </div>
        <h2 className="mt-4 text-2xl font-extrabold">{style.title}</h2>
        {outcome.kind === 'failed' && <p className="mt-2 text-sm text-white/90">{outcome.reason}</p>}
        {outcome.kind === 'already' && (
          <p className="mt-2 text-sm text-white/90">
            Scanned at {formatTime(outcome.registration.checked_in_at!)}
            {outcome.registration.checked_in_by ? ` by ${outcome.registration.checked_in_by.full_name}` : ''}. Don't let them in again.
          </p>
        )}
        {'registration' in outcome && outcome.registration && <TicketDetails registration={outcome.registration} />}
      </div>
      <div className="grid grid-cols-2 gap-3 mt-4">
        <button onClick={onDone} className="py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50">
          Done
        </button>
        <button onClick={onNext} className="py-3 rounded-xl bg-[#1a7a3f] text-white text-sm font-semibold hover:bg-[#155f32]">
          Scan next ticket
        </button>
      </div>
    </div>
  )
}

const RegistrationRow: React.FC<{
  registration: AdminEventRegistration
  onCheckIn: (id: number) => void
  isChecking: boolean
}> = ({ registration, onCheckIn, isChecking }) => (
  <tr className="border-b border-gray-100">
    <td className="py-3 px-4 text-sm font-medium text-gray-900">
      {registration.name}
      {!registration.user && (
        <span className="ml-2 inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-gray-100 text-gray-500">
          Guest
        </span>
      )}
      {registration.ticket_type && (
        <span className="ml-2 inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#1a7a3f]/10 text-[#1a7a3f]">
          {registration.ticket_type.name}
        </span>
      )}
    </td>
    <td className="py-3 px-4 text-sm text-gray-500">{registration.user?.matric_number ?? '—'}</td>
    <td className="py-3 px-4 text-sm text-gray-500">{registration.email}</td>
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
  const [scanMode, setScanMode] = useState<'idle' | 'scanning' | 'checking' | 'result'>('idle')
  const [outcome, setOutcome] = useState<ScanOutcome | null>(null)

  const { data: event } = useEvent(id!)
  const { data: registrations = [], isLoading } = useEventRegistrations(id!, search)
  const checkInMutation = useCheckIn(id!)
  const checkInByTokenMutation = useCheckInByToken(id!)

  const checkedInCount = registrations.filter(r => r.checked_in_at).length

  const handleCheckInResult = (result: { status: string; registration: AdminEventRegistration }) => {
    const type = result.registration.ticket_type
    const typeLabel = type ? ` (${type.name}${type.venue && type.venue !== event?.location ? ` — ${type.venue}` : ''})` : ''
    if (result.status === 'checked_in') {
      toast.success(`Checked in: ${result.registration.name}${typeLabel}`)
    } else {
      toast(`Already checked in: ${result.registration.name} at ${formatTime(result.registration.checked_in_at!)}`, { icon: 'ℹ️' })
    }
  }

  // A 400 with status "not_paid" means the QR belongs to a ticket whose payment hasn't gone through.
  const notPaidName = (error: unknown): string | null => {
    const data = (error as { response?: { data?: { status?: string; registration?: AdminEventRegistration } } })?.response?.data
    return data?.status === 'not_paid' ? data.registration?.name || 'This person' : null
  }

  const handleCheckIn = (registrationId: number) => {
    checkInMutation.mutate(registrationId, {
      onSuccess: handleCheckInResult,
      onError: (error) => {
        const name = notPaidName(error)
        toast.error(name ? `${name}'s ticket hasn't been paid for.` : 'Check-in failed. Please try again.')
      },
    })
  }

  // The camera has already closed by the time this runs; show the outcome in its place.
  const handleScan = (token: string) => {
    setScanMode('checking')
    const show = (result: ScanOutcome) => {
      setOutcome(result)
      setScanMode('result')
      navigator.vibrate?.(result.kind === 'success' ? 120 : [80, 60, 80])
    }
    checkInByTokenMutation.mutate(token.trim(), {
      onSuccess: (result) =>
        show({ kind: result.status === 'checked_in' ? 'success' : 'already', registration: result.registration }),
      onError: (error) => show(scanFailure(error)),
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

        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs px-4 sm:px-6 py-5 mb-6">
          {scanMode === 'idle' && (
            <button
              onClick={() => setScanMode('scanning')}
              className="w-full flex items-center justify-center gap-3 bg-[#1a7a3f] text-white text-lg font-bold py-5 rounded-2xl shadow-md hover:bg-[#155f32] active:scale-[0.99] transition"
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2M7 12h10" />
              </svg>
              Scan ticket
            </button>
          )}
          {scanMode === 'scanning' && (
            <BackCameraScanner onScan={handleScan} onCancel={() => setScanMode('idle')} />
          )}
          {scanMode === 'checking' && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-600">
              <div className="w-10 h-10 border-2 border-gray-200 border-t-[#1a7a3f] rounded-full animate-spin" />
              Checking ticket…
            </div>
          )}
          {scanMode === 'result' && outcome && (
            <ScanResult
              outcome={outcome}
              onNext={() => { setOutcome(null); setScanMode('scanning') }}
              onDone={() => { setOutcome(null); setScanMode('idle') }}
            />
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
