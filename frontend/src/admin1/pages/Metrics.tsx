// src/admin1/pages/Metrics.tsx

import React, { useMemo } from 'react'
import Navbar from '../components/Navbar'
import { Footer } from '../../components/Footer'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { usePublicStats } from '../../lib/hooks/useHomepage'
import { useEvents } from '../../lib/hooks/useEvents'
import { useInquiries } from '../../lib/hooks/useInquiries'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function groupByMonth<T>(items: T[], getDate: (item: T) => string): { month: string; count: number }[] {
  const buckets = Array(12).fill(0)
  items.forEach(item => {
    const d = new Date(getDate(item))
    if (!isNaN(d.getTime())) buckets[d.getMonth()]++
  })
  return MONTHS.map((month, i) => ({ month, count: buckets[i] }))
}

const Skeleton: React.FC<{ w?: string; h?: string }> = ({ w = 'w-full', h = 'h-4' }) => (
  <div className={`${w} ${h} rounded bg-gray-200 animate-pulse`} />
)

interface KpiCardProps {
  label: string
  value: string | number
  loading?: boolean
}

const KpiCard: React.FC<KpiCardProps> = ({ label, value, loading }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
    {loading ? (
      <>
        <Skeleton h="h-7" w="w-16" />
        <div className="mt-2"><Skeleton h="h-3" w="w-24" /></div>
      </>
    ) : (
      <>
        <p className="text-2xl font-black text-gray-900 leading-none tracking-tight">{value}</p>
        <p className="text-xs font-semibold text-gray-500 mt-2 uppercase tracking-wide">{label}</p>
      </>
    )}
  </div>
)

const SectionCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6">
    <h3 className="font-black text-gray-900 text-[15px] tracking-tight mb-5">{title}</h3>
    {children}
  </div>
)

const Metrics: React.FC = () => {
  const { data: stats, isLoading: statsLoading } = usePublicStats()
  const { data: events = [], isLoading: eventsLoading } = useEvents()
  const { data: inquiries = [] } = useInquiries()

  const eventsByMonth = useMemo(() => groupByMonth(events, e => e.start_time), [events])

  const inquiryByType = useMemo(() => {
    const map: Record<string, number> = { general: 0, sponsorship: 0, partnership: 0, recruitment: 0 }
    inquiries.forEach(i => { map[i.type] = (map[i.type] || 0) + 1 })
    return Object.entries(map).map(([name, count]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      count,
    }))
  }, [inquiries])

  const kpis: { label: string; value: number | undefined }[] = [
    { label: 'Students', value: stats?.students },
    { label: 'Projects', value: stats?.projects },
    { label: 'Skills', value: stats?.skills },
    { label: 'Events', value: stats?.events },
    { label: 'Resources', value: stats?.resources },
    { label: 'Executives', value: stats?.executives },
    { label: 'Committees', value: stats?.committees },
    { label: 'Committee Applications', value: stats?.committee_applications },
    { label: 'Gallery Images', value: stats?.gallery_images },
    { label: 'Inquiries', value: stats?.inquiries },
    { label: 'Event Registrations', value: stats?.event_registrations },
    { label: 'Class Sessions', value: stats?.class_sessions },
    { label: 'Class Attendances', value: stats?.class_attendances },
  ]

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <h2 className="text-[22px] md:text-[30px] font-semibold text-gray-900 mb-6">Metrics</h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {kpis.map(k => (
            <KpiCard key={k.label} label={k.label} value={k.value ?? 0} loading={statsLoading} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SectionCard title="Events per Month">
            {eventsLoading ? (
              <Skeleton h="h-56" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={eventsByMonth} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e7eb' }} />
                  <Bar dataKey="count" fill="#1a7a3f" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </SectionCard>

          <SectionCard title="Inquiries by Type">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={inquiryByType} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e7eb' }} />
                <Bar dataKey="count" fill="#1a7a3f" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </SectionCard>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default Metrics
