import React, { useState } from 'react'
import Navbar from '../components/Navbar.jsx'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, Area, AreaChart, CartesianGrid
} from 'recharts'

import user from '../../assets/user.png'
import cash from '../../assets/cash.png'
import receipt from '../../assets/receipt.png'
import box from '../../assets/box.png'
import prev from '../../assets/prev.png'
import curr from '../../assets/current.png'

// ── Placeholder data ───────────────────────────────────────────
const attendanceData = [
  { month: 'Jan', users: 600 }, { month: 'Feb', users: 650 },
  { month: 'Mar', users: 470 }, { month: 'Apr', users: 490 },
  { month: 'May', users: 470 }, { month: 'Jun', users: 620 },
  { month: 'Jul', users: 490 }, { month: 'Aug', users: 510 },
  { month: 'Sep', users: 580 }, { month: 'Oct', users: 600 },
  { month: 'Nov', users: 580 }, { month: 'Dec', users: 490 },
]

const memberGrowthData = Array.from({ length: 10 }, (_, i) => ({
  day: `0${i + 1}`,
  thisMonth: Math.floor(Math.random() * 60) + 60,
  lastMonth: Math.floor(Math.random() * 40) + 40,
}))

const adminLogs = [
  { name: 'Admin 1', percent: 50 },
  { name: 'Admin 2', percent: 30 },
  { name: 'Admin 3', percent: 20 },
  { name: 'Admin 4', percent: 10 },
  { name: 'Admin 5', percent: 10 },
]

// ── Reusable filter tab group ──────────────────────────────────
const FilterTabs = ({ options, active, onChange }) => (
  <div className="flex gap-1">
    {options.map((opt) => (
      <button
        key={opt}
        onClick={() => onChange(opt)}
        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors duration-150 ${
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
const StatCard = ({ icon, value, label }) => (
  <div className="flex items-center gap-4 bg-white rounded-xl border border-gray-100 px-6 py-5 flex-1 shadow-sm">
    <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center text-xl shrink-0">
      {icon}
    </div>
    <div>
      <p className="text-[17px] font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  </div>
)

// ── Donut Chart (CSS-based) ────────────────────────────────────
const DonutChart = () => {
  // finished=800, inProgress=50, failed=150 out of total=1000
  // degrees: finished=288, inProgress=18, failed=54
  return (
    <div className="relative w-36 h-36">
      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
        {/* Track */}
        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f0f0f0" strokeWidth="4" />
        {/* Finished - dark green */}
        <circle
          cx="18" cy="18" r="15.9" fill="none"
          stroke="#1a7a3f" strokeWidth="4"
          strokeDasharray="80 20"
          strokeLinecap="round"
        />
        {/* In-progress - light green */}
        <circle
          cx="18" cy="18" r="15.9" fill="none"
          stroke="#86efac" strokeWidth="4"
          strokeDasharray="5 95"
          strokeDashoffset="-80"
          strokeLinecap="round"
        />
        {/* Failed - yellow */}
        <circle
          cx="18" cy="18" r="15.9" fill="none"
          stroke="#fbbf24" strokeWidth="4"
          strokeDasharray="15 85"
          strokeDashoffset="-85"
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[10px] text-gray-400">Total</span>
        <span className="text-lg font-bold text-gray-900">120</span>
      </div>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────
const Home = () => {
  const [projectFilter, setProjectFilter] = useState('12 months')
  const [growthFilter, setGrowthFilter] = useState('12 months')
  const [attendanceFilter, setAttendanceFilter] = useState('12 months')

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Welcome */}
        <div className="mb-15">
          <h2 className="text-[30px] font-semibold text-gray-900">Welcome back, Habeebullah</h2>
          <p className="text-sm text-gray-400 mt-1">Track, manage operations on Nacos Website</p>
        </div>

        {/* Stat Cards */}
        <div className="flex gap-4 mb-8">
          <StatCard icon="👥" value="2,248+" label="Total Members" />
          <StatCard icon="💰" value="₦2,450,000+" label="Event Attendance" />
          <StatCard icon="📋" value="190+" label="Resources Downloaded" />
          <StatCard icon="📦" value="220" label="Project Downloaded" />
        </div>

        {/* Middle Row */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Project Upload */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[15px] text-gray-900">Project Upload</h3>
              <FilterTabs
                options={['12 months', '30 days', '7 days']}
                active={projectFilter}
                onChange={setProjectFilter}
              />
            </div>

            {/* Counts */}
            <div className="flex gap-33 mb-6 mt-5">
              <div>
                <p className="text-2xl font-bold text-gray-900">1000</p>
                <p className="text-[12px] text-gray-400">Total Projects</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">875</p>
                <p className="text-[12px] text-gray-400">Finished</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">30</p>
                <p className="text-[12px] text-gray-400">In-progress</p>
              </div>
            </div>

            {/* Donut + Legend */}
            <div className="flex items-center gap-8">
              <DonutChart />
              <div className="flex flex-col gap-5">
                <div className="flex items-center gap-14">

                    <div className=" flex flex-row ">

                <div className="flex flex-col">
                    <div className="flex flex-row gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#1a7a3f] mt-1" />
                  <span className="text-[12px] text-gray-600">Finished</span>
                    </div>
                
                  <span className="text-[20px] font-bold text-gray-900 ml-4">800</span>
                  </div>
                
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#86efac] mb-8" />
                  <div className="flex flex-col">
                  <span className="text-[12px] text-gray-600">In-Progress</span>
                  <span className="text-[20px] font-bold text-gray-900 ml-4">50</span>
                  </div>
                </div>
                </div>


                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full mb-9 bg-[#fbbf24]" />
                  <div className="flex flex-col">
                  <span className="text-[12px] text-gray-600">Failed</span>
                  <span className="text-[20px] font-bold text-gray-900 ">150</span>
                  </div>
                </div>
              </div>
            </div>

            {/* New Projects Banner */}
            <div className="flex items-center justify-between mt-6 bg-gray-200 rounded-xl px-4 py-3">
              <span className="text-sm font-semibold text-gray-700">50 New Projects</span>
              <button className="bg-[#1a7a3f] text-white text-sm px-5 py-2 rounded-lg hover:bg-[#155f32] transition-colors duration-200 font-medium">
                View
              </button>
            </div>
          </div>

          {/* Member Growth */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-bold text-gray-900">Member Growth</h3>
              <FilterTabs
                options={['12 months', '30 days', '7 days']}
                active={growthFilter}
                onChange={setGrowthFilter}
              />
            </div>

            {/* Previous vs Current */}
            <div className="flex gap-8 mb-4">
              <div>
                <p className="text-[13px] text-gray-400 mb-0.5">Previous</p>
                <div className="flex flex-row gap-2">
                    <img src={prev} className="w-3 h-3 mt-1" alt="Previous" />
                  <span className="text-sm font-bold text-gray-800">12,300,500</span>
                </div>
              </div>
              <div>
                <p className="text-[11px] text-gray-400 mb-0.5">Current</p>
                <div className="flex flex-row gap-1">
                   <img src={curr} className="w-4 h-4 mt-1" alt="Current" />
                  <span className="text-sm font-bold text-gray-800">18,300,500</span>
                </div>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={memberGrowthData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="thisMonthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#86efac" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#86efac" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
                <Tooltip
                  contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e7eb' }}
                  formatter={(val, name) => [val, name === 'thisMonth' ? 'This month' : 'Last Month']}
                />
                <Area type="monotone" dataKey="thisMonth" stroke="#1a7a3f" strokeWidth={2} fill="url(#thisMonthGrad)" />
                <Line type="monotone" dataKey="lastMonth" stroke="#fbbf24" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-2 gap-6">
          {/* Event Attendance */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Event Attendance</h3>
              <FilterTabs
                options={['12 months', '3 months', '30 days', '7 days', '24 hours']}
                active={attendanceFilter}
                onChange={setAttendanceFilter}
              />
            </div>

            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={attendanceData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
                <Tooltip
                  contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e7eb' }}
                  cursor={{ fill: '#f0fdf4' }}
                />
                <Bar dataKey="users" fill="#1a7a3f" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Admin Logs */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-gray-900">Admin Logs</h3>
                <p className="text-xs text-gray-400 mt-0.5">Total Logs - 10</p>
              </div>
              <button className="text-xs text-[#1a7a3f] font-medium hover:underline">View all</button>
            </div>

            <div className="flex flex-col gap-4">
              {adminLogs.map((log, i) => (
                <div key={i} className="flex items-center gap-3">
                  {/* Avatar placeholder */}
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
    </div>
  )
}

export default Home
