// src/admin1/pages/Home.tsx

import React, { useState, useMemo } from 'react'
import Navbar from '../components/Navbar'
import { Footer } from '../../components/Footer'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Line, Area, AreaChart, CartesianGrid,
} from 'recharts'

import userIcon from '../../assets/user.png'
import cash from '../../assets/cash.png'
import receipt from '../../assets/receipt.png'
import box from '../../assets/box.png'
import prev from '../../assets/prev.png'
import curr from '../../assets/current.png'

// ── Types ─────────────────────────────────────────────────
interface GrowthDataPoint {
  day: string
  label: string
  thisMonth: number
  lastMonth: number
  other: number
}

interface AttendanceDataPoint {
  month: string
  users: number
}

interface AdminLog {
  name: string
  percent: number
}

interface FilterTabsProps {
  options: string[]
  active: string
  onChange: (opt: string) => void
}

interface StatCardProps {
  icon: string
  value: string
  label: string
}

// ── Generate 30 days of member growth data ─────────────────────
const allMemberGrowthData: GrowthDataPoint[] = Array.from({ length: 30 }, (_, i) => ({
  day: String(i + 1).padStart(2, '0'),
  label: i === 0 ? '02 jan' : String(i + 1).padStart(2, '0'),
  thisMonth: Math.floor(Math.random() * 30) + 60 + (i > 3 ? 15 : 0),
  lastMonth: Math.floor(Math.random() * 15) + 42,
  other:     Math.floor(Math.random() * 10) + 10,
}))
allMemberGrowthData[4].thisMonth = 110

// ── Attendance data ────────────────────────────────────────────
const attendanceData: AttendanceDataPoint[] = [
  { month: 'Jan', users: 600 }, { month: 'Feb', users: 650 },
  { month: 'Mar', users: 470 }, { month: 'Apr', users: 490 },
  { month: 'May', users: 470 }, { month: 'Jun', users: 620 },
  { month: 'Jul', users: 490 }, { month: 'Aug', users: 510 },
  { month: 'Sep', users: 580 }, { month: 'Oct', users: 600 },
  { month: 'Nov', users: 580 }, { month: 'Dec', users: 490 },
]

const adminLogs: AdminLog[] = [
  { name: 'Admin 1', percent: 50 },
  { name: 'Admin 2', percent: 30 },
  { name: 'Admin 3', percent: 20 },
  { name: 'Admin 4', percent: 10 },
  { name: 'Admin 5', percent: 10 },
]

const DAYS_PER_PAGE = 10

// ── Filter Tabs ────────────────────────────────────────────────
const FilterTabs: React.FC<FilterTabsProps> = ({ options, active, onChange }) => (
  <div className="flex gap-1 flex-wrap">
    {options.map((opt) => (
      <button
        key={opt}
        onClick={() => onChange(opt)}
        className={`px-2 md:px-3 py-1 rounded-md text-[11px] md:text-xs font-medium transition-colors duration-150 ${
          active === opt
            ? 'bg-white border border-gray-300 text-gray-800 shadow-sm'
            : 'text-gray-400 hover:text-gray-600'
        }`}
      >
        {opt}
      </button>
    ))}
  </div>
)

// ── Stat Card ──────────────────────────────────────────────────
const StatCard: React.FC<StatCardProps> = ({ icon, value, label }) => (
  <div className="flex items-center gap-3 md:gap-4 bg-white rounded-xl border border-gray-100 px-4 md:px-6 py-4 md:py-5 flex-1 shadow-sm min-w-0">
    <div className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
      <img src={icon} alt={label} className="w-5 h-5 md:w-6 md:h-6 object-contain" />
    </div>
    <div className="min-w-0">
      <p className="text-[14px] md:text-[17px] font-bold text-gray-900 truncate">{value}</p>
      <p className="text-[10px] md:text-xs text-gray-500 mt-0.5 truncate">{label}</p>
    </div>
  </div>
)

// ── Three Separate Concentric Donut Rings ──────────────────────
const DonutChart: React.FC = () => {
  const size = 140
  const cx = 70
  const cy = 70

  const TrackRing: React.FC<{ r: number; strokeWidth?: number }> = ({ r, strokeWidth = 6 }) => (
    <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f0f0f0" strokeWidth={strokeWidth} />
  )

  const FilledRing: React.FC<{ r: number; color: string; percent: number; strokeWidth?: number }> = ({ r, color, percent, strokeWidth = 6 }) => {
    const circumference = 2 * Math.PI * r
    const dash = (percent / 100) * circumference
    return (
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={`${dash} ${circumference - dash}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
      />
    )
  }

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <TrackRing r={58} />
        <TrackRing r={44} />
        <TrackRing r={30} />
        <FilledRing r={58} color="#1a7a3f" percent={80} />
        <FilledRing r={44} color="#86efac" percent={50} />
        <FilledRing r={30} color="#fbbf24" percent={15} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[10px] text-gray-400">Total</span>
        <span className="text-lg font-bold text-gray-900">120</span>
      </div>
    </div>
  )
}

// ── Custom axis ticks ──────────────────────────────────────────
interface TickProps {
  x?: number
  y?: number
  payload?: { value: string | number }
}

const CustomYTick: React.FC<TickProps> = ({ x = 0, y = 0, payload }) => (
  <text x={x} y={y} dy={4} textAnchor="end" fill="#9ca3af" fontSize={10}>
    {payload?.value}
  </text>
)

const CustomXTick: React.FC<TickProps> = ({ x = 0, y = 0, payload }) => (
  <text x={x} y={y} dy={10} textAnchor="middle" fill="#9ca3af" fontSize={10}>
    {payload?.value}
  </text>
)

// ── Main Component ─────────────────────────────────────────────
const Home: React.FC = () => {
  const [projectFilter,    setProjectFilter]    = useState<string>('12 months')
  const [growthFilter,     setGrowthFilter]     = useState<string>('12 months')
  const [attendanceFilter, setAttendanceFilter] = useState<string>('12 months')
  const [growthPage,       setGrowthPage]       = useState<number>(0)

  const totalPages = Math.ceil(allMemberGrowthData.length / DAYS_PER_PAGE)

  const visibleGrowthData = useMemo<GrowthDataPoint[]>(() => {
    const start = growthPage * DAYS_PER_PAGE
    return allMemberGrowthData.slice(start, start + DAYS_PER_PAGE)
  }, [growthPage])

  const visibleDays = visibleGrowthData.map((d) => d.day)

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">

        {/* Welcome */}
        <div className="mb-8 md:mb-12">
          <h2 className="text-[22px] md:text-[30px] font-semibold text-gray-900">Welcome back, Habeebullah</h2>
          <p className="text-xs md:text-sm text-gray-400 mt-1">Track, manage operations on Nacos Website</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
          <StatCard icon={userIcon} value="2,248+"      label="Total Members" />
          <StatCard icon={cash}     value="₦2,450,000+" label="Event Attendance" />
          <StatCard icon={receipt}  value="190+"        label="Resources Downloaded" />
          <StatCard icon={box}      value="220"         label="Project Downloaded" />
        </div>

        {/* Middle Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

          {/* Project Upload */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 md:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[15px] text-gray-900">Project Upload</h3>
              <FilterTabs options={['12 months', '30 days', '7 days']} active={projectFilter} onChange={setProjectFilter} />
            </div>

            <div className="flex gap-6 md:gap-10 mb-6 mt-5 flex-wrap">
              <div>
                <p className="text-xl md:text-2xl font-bold text-gray-900">1000</p>
                <p className="text-[12px] text-gray-400">Total Projects</p>
              </div>
              <div>
                <p className="text-xl md:text-2xl font-bold text-gray-900">875</p>
                <p className="text-[12px] text-gray-400">Finished</p>
              </div>
              <div>
                <p className="text-xl md:text-2xl font-bold text-gray-900">30</p>
                <p className="text-[12px] text-gray-400">In-progress</p>
              </div>
            </div>

            <div className="flex items-center gap-6 md:gap-8">
              <DonutChart />
              <div className="flex flex-col gap-5">
                <div className="flex flex-row gap-6 md:gap-10">
                  <div className="flex flex-col">
                    <div className="flex flex-row gap-2 items-center">
                      <span className="w-2 h-2 rounded-full bg-[#1a7a3f]" />
                      <span className="text-[12px] text-gray-600">Finished</span>
                    </div>
                    <span className="text-[18px] md:text-[20px] font-bold text-gray-900 ml-4">800</span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex flex-row gap-2 items-center">
                      <span className="w-2 h-2 rounded-full bg-[#86efac]" />
                      <span className="text-[12px] text-gray-600">In-Progress</span>
                    </div>
                    <span className="text-[18px] md:text-[20px] font-bold text-gray-900 ml-4">50</span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <div className="flex flex-row gap-2 items-center">
                    <span className="w-2 h-2 rounded-full bg-[#fbbf24]" />
                    <span className="text-[12px] text-gray-600">Failed</span>
                  </div>
                  <span className="text-[18px] md:text-[20px] font-bold text-gray-900 ml-4">150</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-6 bg-gray-200 rounded-xl px-4 py-3">
              <span className="text-sm font-semibold text-gray-700">50 New Projects</span>
              <button className="bg-[#1a7a3f] text-white text-sm px-5 py-2 rounded-lg hover:bg-[#155f32] transition-colors duration-200 font-medium">
                View
              </button>
            </div>
          </div>

          {/* Member Growth */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 md:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-gray-900 text-[15px]">Member Growth</h3>
              <FilterTabs options={['12 months', '30 days', '7 days']} active={growthFilter} onChange={setGrowthFilter} />
            </div>

            <div className="flex gap-8 mb-3">
              <div>
                <p className="text-[11px] text-gray-400 mb-1">Previous</p>
                <div className="flex flex-row gap-2 items-center">
                  <img src={prev} className="w-3 h-3" alt="Previous" />
                  <span className="text-sm font-bold text-gray-800">12,300,500</span>
                </div>
              </div>
              <div>
                <p className="text-[11px] text-gray-400 mb-1">Current</p>
                <div className="flex flex-row gap-1 items-center">
                  <img src={curr} className="w-4 h-4" alt="Current" />
                  <span className="text-sm font-bold text-gray-800">18,300,500</span>
                </div>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={190}>
              <AreaChart data={visibleGrowthData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="thisMonthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#86efac" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#86efac" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="day" hide />
                <YAxis tick={<CustomYTick />} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff' }}
                  formatter={(val: number | undefined, name: string | undefined) => {
                    const map: Record<string, string> = { thisMonth: 'This month', lastMonth: 'Last Month', other: 'Other' }
                    return [val ?? 0, map[name ?? ''] || name || '']
                  }}
                  labelFormatter={(label: React.ReactNode) => `Day ${String(label)}`}
                />
                <Area
                  type="monotone"
                  dataKey="thisMonth"
                  stroke="#1a7a3f"
                  strokeWidth={2}
                  fill="url(#thisMonthGrad)"
                  dot={false}
                  activeDot={{ r: 5, fill: '#1a7a3f' }}
                />
                <Line type="monotone" dataKey="lastMonth" stroke="#fbbf24" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="other"     stroke="#1e3a5f" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 px-1">
              <button
                onClick={() => setGrowthPage((p) => Math.max(0, p - 1))}
                disabled={growthPage === 0}
                className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-gray-400 hover:border-[#1a7a3f] hover:text-[#1a7a3f] disabled:opacity-25 disabled:cursor-not-allowed transition-colors shrink-0"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <div className="flex items-center gap-2 md:gap-3 overflow-x-auto no-scrollbar">
                {visibleDays.map((d) => (
                  <span key={d} className="text-[11px] text-gray-400 shrink-0 w-5 text-center">
                    {d}
                  </span>
                ))}
              </div>

              <button
                onClick={() => setGrowthPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={growthPage === totalPages - 1}
                className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-gray-400 hover:border-[#1a7a3f] hover:text-[#1a7a3f] disabled:opacity-25 disabled:cursor-not-allowed transition-colors shrink-0"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6">

          {/* Event Attendance */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 md:p-6 shadow-sm">
            <div className="flex flex-col mb-4">
              <h3 className="font-bold text-gray-900 text-[15px] mb-4">Event Attendance</h3>
              <FilterTabs
                options={['12 months', '3 months', '30 days', '7 days', '24 hours']}
                active={attendanceFilter}
                onChange={setAttendanceFilter}
              />
            </div>

            <div className="flex items-center gap-1">
              <div className="flex items-center justify-center shrink-0" style={{ width: 16, height: 220 }}>
                <span
                  className="text-[10px] text-gray-400 font-medium whitespace-nowrap"
                  style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
                >
                  Active users
                </span>
              </div>

              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={attendanceData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="month" tick={<CustomXTick />} axisLine={false} tickLine={false} />
                  <YAxis tick={<CustomYTick />} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e7eb' }}
                    cursor={{ fill: '#f0fdf4' }}
                  />
                  <Bar dataKey="users" fill="#1a7a3f" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Admin Logs */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 md:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-gray-900 text-[15px]">Admin Logs</h3>
                <p className="text-xs text-gray-400 mt-0.5">Total Logs - 10</p>
              </div>
              <button className="text-xs text-[#1a7a3f] font-medium hover:underline">View all</button>
            </div>

            <div className="flex flex-col gap-4">
              {adminLogs.map((log, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-700 mb-1">{log.name}</p>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className="bg-[#1a7a3f] h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${log.percent}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 font-medium w-8 text-right">{log.percent}%</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  )
}

export default Home