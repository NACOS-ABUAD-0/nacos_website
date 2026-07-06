// src/admin1/pages/Home.tsx

import React, { useMemo } from 'react'
import Navbar from '../components/Navbar'
import { Footer } from '../../components/Footer'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid,
} from 'recharts'

// ── Hooks (only using confirmed data shapes) ───────────────────
import { usePublicStats }    from '../../lib/hooks/useHomepage'      // { students, projects, skills, events, resources }
import { useEvents }         from '../../lib/hooks/useEvents'         // Event[] — status: 'upcoming'|'ongoing'|'completed', start_time, title, is_published
import { useInquiries }      from '../../lib/hooks/useInquiries'      // Inquiry[] — type, status, created_at, name
import { useAdminUsers }     from '../../lib/hooks/useAdminUsers'     // { users, pagination }
import { useStudentProfile } from '../../lib/hooks/useStudentProfile' // { full_name, email, ... }
import { useProjects }       from '../../lib/hooks/useProjects'       // Project[] — id, title, is_featured, updated_at, tags, owner

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

/** Group an array of items by calendar month using a date-string field */
function groupByMonth<T>(items: T[], getDate: (item: T) => string): { month: string; count: number }[] {
  const buckets = Array(12).fill(0)
  items.forEach(item => {
    const d = new Date(getDate(item))
    if (!isNaN(d.getTime())) buckets[d.getMonth()]++
  })
  return MONTHS.map((month, i) => ({ month, count: buckets[i] }))
}

/** Get greeting based on time of day */
function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

// ─────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────

const Skeleton: React.FC<{ w?: string; h?: string; rounded?: string }> = ({
  w = 'w-full', h = 'h-4', rounded = 'rounded'
}) => (
  <div className={`${w} ${h} ${rounded} bg-gray-200 animate-pulse`} />
)

interface KpiCardProps {
  label: string
  value: string | number
  sub?: string
  accent: string   // tailwind bg class for the left border / icon bg
  icon: React.ReactNode
  loading?: boolean
}

const KpiCard: React.FC<KpiCardProps> = ({ label, value, sub, accent, icon, loading }) => (
  <div className={`relative bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex gap-4 items-start overflow-hidden`}>
    {/* accent strip */}
    <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${accent}`} />
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${accent} bg-opacity-10`}>
      {icon}
    </div>
    <div className="min-w-0">
      {loading ? (
        <>
          <Skeleton h="h-6" w="w-16" rounded="rounded-md" />
          <Skeleton h="h-3" w="w-24" rounded="rounded mt-1.5" />
        </>
      ) : (
        <>
          <p className="text-2xl font-black text-gray-900 leading-none tracking-tight">{value}</p>
          <p className="text-xs font-semibold text-gray-500 mt-1 uppercase tracking-wide">{label}</p>
          {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
        </>
      )}
    </div>
  </div>
)

interface SectionCardProps {
  title: string
  sub?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}

const SectionCard: React.FC<SectionCardProps> = ({ title, sub, action, children, className = '' }) => (
  <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6 ${className}`}>
    <div className="flex items-start justify-between mb-5">
      <div>
        <h3 className="font-black text-gray-900 text-[15px] tracking-tight">{title}</h3>
        {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
      {action}
    </div>
    {children}
  </div>
)

// ─────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────

const Home: React.FC = () => {
  // ── Data fetching ──────────────────────────────────────────────
  const { data: stats, isLoading: statsLoading }              = usePublicStats()
  const { data: events = [], isLoading: eventsLoading }       = useEvents()
  const { data: inquiries = [], isLoading: inquiriesLoading } = useInquiries()
  const { pagination, isLoading: usersLoading }               = useAdminUsers()
  const { data: profile, isLoading: profileLoading }          = useStudentProfile()
  // useProjects returns one paginated page. Its length is a floor, not total.
  // stats.projects from /admin/stats/ is the authoritative total count.
  const { data: projects = [], isLoading: projectsLoading }   = useProjects()

  // ── Derived: events by status (using confirmed `status` field) ─
  const eventsByStatus = useMemo(() => {
    const upcoming  = events.filter(e => e.status === 'upcoming').length
    const ongoing   = events.filter(e => e.status === 'ongoing').length
    const completed = events.filter(e => e.status === 'completed').length
    return { upcoming, ongoing, completed, total: events.length }
  }, [events])

  // ── Derived: events per month (using confirmed `start_time`) ───
  const eventsByMonth = useMemo(
    () => groupByMonth(events, e => e.start_time),
    [events]
  )

  // ── Derived: inquiries by type (confirmed: type field) ─────────
  const inquiryByType = useMemo(() => {
    const map: Record<string, number> = {
      general: 0, sponsorship: 0, partnership: 0, recruitment: 0,
    }
    inquiries.forEach(i => { map[i.type] = (map[i.type] || 0) + 1 })
    return Object.entries(map).map(([name, count]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      count,
    }))
  }, [inquiries])

  // ── Derived: inquiries by status (confirmed: status field) ─────
  const inquiryByStatus = useMemo(() => ({
    new:       inquiries.filter(i => i.status === 'new').length,
    read:      inquiries.filter(i => i.status === 'read').length,
    responded: inquiries.filter(i => i.status === 'responded').length,
    archived:  inquiries.filter(i => i.status === 'archived').length,
  }), [inquiries])

  // ── Derived: inquiries per month ───────────────────────────────
  const inquiriesByMonth = useMemo(
    () => groupByMonth(inquiries, i => i.created_at),
    [inquiries]
  )

  // ── Recent inquiries (last 5, newest first) ────────────────────
  const recentInquiries = useMemo(
    () => [...inquiries]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5),
    [inquiries]
  )

  // ── Upcoming events list (next 4) ──────────────────────────────
  const upcomingEventsList = useMemo(
    () => events
      .filter(e => e.status === 'upcoming')
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
      .slice(0, 4),
    [events]
  )

  // ── Admin name from profile ────────────────────────────────────
  const adminName = profile?.full_name
    ? profile.full_name.split(' ')[0]   // first name only
    : null

  // ── Stats values ─────────────────────────────────────────────
  // Prefer admin stats endpoint (authoritative totals). But if it returns
  // 0 (endpoint down, not yet seeded, etc.), fall back to the length of
  // whatever the list hooks fetched — fixing the "0 projects" bug.
  const totalMembers   = (stats?.students  ?? 0) > 0 ? stats!.students  : pagination.count
  const totalProjects  = (stats?.projects  ?? 0) > 0 ? stats!.projects  : projects.length
  const totalResources = (stats?.resources ?? 0) > 0 ? stats!.resources : 0
  const totalEvents    = (stats?.events    ?? 0) > 0 ? stats!.events    : events.length
  const totalComplaints = stats?.complaints ?? 0
  const projectsReady  = !statsLoading && !projectsLoading

  // ─────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#f4f6f3] font-sans">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-10">

        {/* ── Welcome banner ─────────────────────────────────── */}
        <div className="mb-8 flex items-end justify-between">
          <div>
            {profileLoading ? (
              <>
                <Skeleton h="h-8" w="w-64" rounded="rounded-lg" />
                <Skeleton h="h-4" w="w-40" rounded="rounded mt-2" />
              </>
            ) : (
              <>
                <h2 className="text-[26px] md:text-[34px] font-black text-gray-900 tracking-tight leading-none">
                  {greeting()}{adminName ? `, ${adminName}` : ''}.
                </h2>
                <p className="text-sm text-gray-400 mt-1.5">
                  Here's what's happening on Nacos today.
                </p>
              </>
            )}
          </div>

          {/* Live date badge */}
          <div className="hidden md:flex flex-col items-end">
            <span className="text-xs font-bold text-[#1a7a3f] uppercase tracking-widest">
              {new Date().toLocaleDateString('en-GB', { weekday: 'long' })}
            </span>
            <span className="text-sm text-gray-500">
              {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* ── KPI row ────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4 mb-6">
          <KpiCard
            label="Members"
            value={statsLoading || usersLoading ? '—' : totalMembers.toLocaleString()}
            sub="registered students"
            accent="bg-[#1a7a3f]"
            loading={statsLoading && usersLoading}
            icon={
              <svg className="w-5 h-5 text-[#1a7a3f]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
              </svg>
            }
          />
          <KpiCard
            label="Projects"
            value={!projectsReady ? '—' : totalProjects.toLocaleString()}
            sub="total submitted"
            accent="bg-blue-500"
            loading={!projectsReady}
            icon={
              <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            }
          />
          <KpiCard
            label="Resources"
            value={statsLoading ? '—' : totalResources.toLocaleString()}
            sub="available downloads"
            accent="bg-amber-500"
            loading={statsLoading}
            icon={
              <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          />
          <KpiCard
            label="Events"
            value={statsLoading || eventsLoading ? '—' : totalEvents.toLocaleString()}
            sub={eventsLoading ? undefined : `${eventsByStatus.upcoming} upcoming`}
            accent="bg-rose-500"
            loading={statsLoading && eventsLoading}
            icon={
              <svg className="w-5 h-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
          />
          <KpiCard
            label="Complaints"
            value={statsLoading ? '—' : totalComplaints.toLocaleString()}
            sub="total submitted"
            accent="bg-purple-500"
            loading={statsLoading}
            icon={
              <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>

        {/* ── Middle row: Events chart + Inquiries chart ──────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-4 mb-4">

          {/* Events per month bar chart */}
          <SectionCard
            title="Events This Year"
            sub={eventsLoading ? undefined : `${eventsByStatus.upcoming} upcoming · ${eventsByStatus.ongoing} ongoing · ${eventsByStatus.completed} completed`}
          >
            {eventsLoading ? (
              <div className="h-[220px] bg-gray-100 rounded-xl animate-pulse" />
            ) : events.length === 0 ? (
              <EmptyState message="No events found" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={eventsByMonth} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: '#9ca3af', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: '#9ca3af', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e7eb' }}
                    cursor={{ fill: '#f0fdf4' }}
                    formatter={(val: number) => [val, 'Events']}
                  />
                  <Bar dataKey="count" name="Events" fill="#1a7a3f" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}

            {/* Event status pills */}
            {!eventsLoading && events.length > 0 && (
              <div className="flex gap-2 mt-4 flex-wrap">
                {[
                  { label: 'Upcoming',  count: eventsByStatus.upcoming,  color: 'bg-[#1a7a3f]' },
                  { label: 'Ongoing',   count: eventsByStatus.ongoing,   color: 'bg-amber-500' },
                  { label: 'Completed', count: eventsByStatus.completed, color: 'bg-gray-300' },
                ].map(s => (
                  <span key={s.label} className="flex items-center gap-1.5 text-[11px] font-medium text-gray-600 bg-gray-50 border border-gray-100 rounded-full px-3 py-1">
                    <span className={`w-2 h-2 rounded-full ${s.color}`} />
                    {s.label}: {s.count}
                  </span>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Inquiries by type */}
          <SectionCard
            title="Inquiries"
            sub={inquiriesLoading ? undefined : `${inquiries.length} total · ${inquiryByStatus.new} new`}
            action={
              <button className="text-xs text-[#1a7a3f] font-semibold hover:underline">View all</button>
            }
          >
            {inquiriesLoading ? (
              <div className="space-y-3">
                {[1,2,3,4].map(i => <Skeleton key={i} h="h-8" rounded="rounded-lg" />)}
              </div>
            ) : inquiries.length === 0 ? (
              <EmptyState message="No inquiries yet" />
            ) : (
              <>
                {/* Status breakdown */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {[
                    { label: 'New',       value: inquiryByStatus.new,       color: '#1a7a3f' },
                    { label: 'Read',      value: inquiryByStatus.read,      color: '#86efac' },
                    { label: 'Responded', value: inquiryByStatus.responded, color: '#3b82f6' },
                    { label: 'Archived',  value: inquiryByStatus.archived,  color: '#d1d5db' },
                  ].map(s => (
                    <div key={s.label} className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5">
                      <p className="text-lg font-black text-gray-900">{s.value}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                        <p className="text-[10px] text-gray-500 font-medium">{s.label}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* By type bars */}
                <div className="space-y-2">
                  {inquiryByType.filter(t => t.count > 0).map(t => (
                    <div key={t.name} className="flex items-center gap-2">
                      <span className="text-[11px] text-gray-500 w-20 shrink-0">{t.name}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full bg-[#1a7a3f] transition-all duration-700"
                          style={{ width: inquiries.length > 0 ? `${(t.count / inquiries.length) * 100}%` : '0%' }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-gray-700 w-4 text-right">{t.count}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </SectionCard>
        </div>

        {/* ── Bottom row: Inquiries over time + Upcoming events + Members ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-4">

          {/* Upcoming events list */}
          <SectionCard
            title="Upcoming Events"
            sub={`${eventsByStatus.upcoming} scheduled`}
          >
            {eventsLoading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <Skeleton key={i} h="h-14" rounded="rounded-xl" />)}
              </div>
            ) : upcomingEventsList.length === 0 ? (
              <EmptyState message="No upcoming events" />
            ) : (
              <div className="space-y-2">
                {upcomingEventsList.map(event => (
                  <div key={event.id} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                    {/* Date block */}
                    <div className="shrink-0 w-10 flex flex-col items-center bg-[#1a7a3f] rounded-lg py-1.5 text-white">
                      <span className="text-[10px] font-bold uppercase leading-none">
                        {new Date(event.start_time).toLocaleDateString('en-GB', { month: 'short' })}
                      </span>
                      <span className="text-[16px] font-black leading-none">
                        {new Date(event.start_time).getDate()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-bold text-gray-800 leading-tight truncate">{event.title}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {event.is_remote ? '📡 Remote' : event.location || 'TBD'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Inquiries over time + recent list */}
          <SectionCard
            title="Inquiry Activity"
            sub="Monthly volume this year"
          >
            {inquiriesLoading ? (
              <div className="h-[160px] bg-gray-100 rounded-xl animate-pulse" />
            ) : inquiries.length === 0 ? (
              <EmptyState message="No inquiries to display" />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={140}>
                  <AreaChart data={inquiriesByMonth} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="inquiryGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#1a7a3f" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#1a7a3f" stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e7eb' }}
                      formatter={(val: number) => [val, 'Inquiries']}
                    />
                    <Area type="monotone" dataKey="count" stroke="#1a7a3f" strokeWidth={2} fill="url(#inquiryGrad)" dot={false} activeDot={{ r: 4, fill: '#1a7a3f' }} />
                  </AreaChart>
                </ResponsiveContainer>

                {/* Recent inquiries */}
                <div className="mt-4 space-y-1.5">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Recent</p>
                  {recentInquiries.map(inq => (
                    <div key={inq.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`shrink-0 w-1.5 h-1.5 rounded-full ${
                          inq.status === 'new'       ? 'bg-[#1a7a3f]' :
                          inq.status === 'read'      ? 'bg-amber-400' :
                          inq.status === 'responded' ? 'bg-blue-400'  : 'bg-gray-300'
                        }`} />
                        <span className="text-[12px] font-medium text-gray-700 truncate">{inq.name}</span>
                        <span className="text-[11px] text-gray-400 shrink-0 capitalize">{inq.type}</span>
                      </div>
                      <span className="text-[10px] text-gray-400 shrink-0 ml-2">
                        {new Date(inq.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </SectionCard>
        </div>

      </main>
      <Footer />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────────────────────────

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-10 text-gray-300">
    <svg className="w-10 h-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
    <p className="text-sm font-medium">{message}</p>
  </div>
)

export default Home