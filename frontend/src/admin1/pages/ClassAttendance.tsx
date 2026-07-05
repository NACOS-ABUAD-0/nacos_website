// src/admin1/pages/ClassAttendance.tsx
import React, { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import { Footer } from '../../components/Footer'
import {
  useClassSessions,
  useClassSession,
  useCreateClassSession,
  useCloseClassSession,
} from '../../lib/hooks/useClassAttendance'

const formatTime = (iso: string): string =>
  new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

const ClassAttendance: React.FC = () => {
  const [courseCode, setCourseCode] = useState('')
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null)

  const { data: sessions = [] } = useClassSessions()
  const { data: session } = useClassSession(activeSessionId ?? '')
  const createMutation = useCreateClassSession()
  const closeMutation = useCloseClassSession()

  const handleGenerate = () => {
    if (!courseCode.trim()) return void toast.error('Enter a course code first.')
    createMutation.mutate(courseCode.trim().toUpperCase(), {
      onSuccess: (created) => {
        setActiveSessionId(created.id)
        toast.success(`QR generated for ${created.course_code}`)
      },
      onError: () => toast.error('Failed to generate session.'),
    })
  }

  const handleClose = () => {
    if (!activeSessionId) return
    closeMutation.mutate(activeSessionId, {
      onSuccess: () => toast.success('Session closed.'),
      onError: () => toast.error('Failed to close session.'),
    })
  }

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs px-8 py-7 mb-6">
          <h1 className="text-[26px] font-extrabold text-[#1a7a3f] mb-1">Class Attendance</h1>
          <p className="text-sm text-gray-500">
            Generate a QR code for today's class — students scan it with their own phones to be
            marked present. Closing a session permanently disables its QR code.
          </p>
        </div>

        {!activeSessionId && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs px-6 py-5 mb-6">
            <label className="text-xs font-semibold text-gray-500 uppercase">Course Code</label>
            <div className="flex gap-2 mt-1">
              <input
                value={courseCode}
                onChange={e => setCourseCode(e.target.value)}
                placeholder="e.g. CSC301"
                className="border p-2 rounded-lg text-sm flex-1"
              />
              <button
                onClick={handleGenerate}
                disabled={createMutation.isPending}
                className="bg-[#1a7a3f] text-white text-sm px-5 py-2 rounded-lg hover:bg-[#155f32] disabled:opacity-50"
              >
                {createMutation.isPending ? 'Generating…' : 'Generate QR'}
              </button>
            </div>
          </div>
        )}

        {activeSessionId && session && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs px-6 py-7 mb-6 flex flex-col items-center text-center">
            <button
              onClick={() => setActiveSessionId(null)}
              className="self-start text-sm text-gray-500 hover:text-gray-700 mb-4"
            >
              ← New session
            </button>
            <h2 className="text-xl font-bold text-gray-900 mb-1">{session.course_code}</h2>
            <p className="text-sm text-gray-500 mb-5">
              Opened at {formatTime(session.opened_at)}
              {!session.is_open && ` · Closed at ${formatTime(session.closed_at!)}`}
            </p>

            {session.is_open ? (
              <>
                <QRCodeSVG value={session.token} size={260} />
                <p className="text-lg font-semibold text-gray-900 mt-5">
                  {session.attendee_count} student{session.attendee_count !== 1 ? 's' : ''} scanned
                </p>
                <button
                  onClick={handleClose}
                  disabled={closeMutation.isPending}
                  className="mt-5 bg-red-500 text-white text-sm px-6 py-2 rounded-lg hover:bg-red-600 disabled:opacity-50"
                >
                  {closeMutation.isPending ? 'Closing…' : 'Close Session'}
                </button>
              </>
            ) : (
              <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold bg-gray-100 text-gray-600">
                Session closed — {session.attendee_count} student{session.attendee_count !== 1 ? 's' : ''} attended
              </span>
            )}

            {session.attendances.length > 0 && (
              <div className="w-full mt-6 max-h-64 overflow-y-auto border-t border-gray-100 pt-4">
                {session.attendances.map(a => (
                  <div key={a.id} className="flex justify-between text-sm py-1.5 text-left">
                    <span className="font-medium text-gray-800">{a.student.full_name}</span>
                    <span className="text-gray-500">{a.student.matric_number ?? '—'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs px-6 py-5">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Past Sessions</h3>
          {sessions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No sessions yet.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 text-left">
                  <th className="py-2 px-2 text-xs font-semibold text-gray-500 uppercase">Course</th>
                  <th className="py-2 px-2 text-xs font-semibold text-gray-500 uppercase">Opened</th>
                  <th className="py-2 px-2 text-xs font-semibold text-gray-500 uppercase">Attendees</th>
                  <th className="py-2 px-2 text-xs font-semibold text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map(s => (
                  <tr
                    key={s.id}
                    className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
                    onClick={() => setActiveSessionId(s.id)}
                  >
                    <td className="py-2 px-2 text-sm font-medium text-gray-900">{s.course_code}</td>
                    <td className="py-2 px-2 text-sm text-gray-500">
                      {new Date(s.opened_at).toLocaleDateString()} {formatTime(s.opened_at)}
                    </td>
                    <td className="py-2 px-2 text-sm text-gray-500">{s.attendee_count}</td>
                    <td className="py-2 px-2">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                          s.is_open ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {s.is_open ? 'Open' : 'Closed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default ClassAttendance
