import React, { useState, useRef, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import Logo from '../../assets/nacos_logo.png'
import profileImg from '../../assets/profile.png' // your uploaded profile image

const Navbar = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <nav className="flex flex-row items-center justify-between px-4 md:px-10 py-4 border-b border-gray-200 bg-white sticky top-0 z-50">
      {/* Logo + Brand */}
      <div className="flex flex-row items-center gap-2">
        <img src={Logo} alt="NACOS Logo" className="w-9 h-9 md:w-10 md:h-10" />
        <h1 className="text-[15px] md:text-[18px] font-bold text-black tracking-wide">NACOS ABUAD</h1>
      </div>

      {/* Nav Links — hidden on mobile, shown md+ */}
      <ul className="hidden md:flex items-center gap-6 lg:gap-8">
        {[
          { label: 'Home',      to: '/admin' },
          { label: 'Events',    to: '/admin/events' },
          { label: 'Metrics',   to: '/admin/metrics' },
          { label: 'Approvals', to: '/admin/approvals' },
        ].map(({ label, to }) => (
          <li key={label}>
            <NavLink
              to={to}
              end={to === '/admin'}
              className={({ isActive }) =>
                `text-[14px] font-medium pb-1 transition-colors duration-200 ${
                  isActive
                    ? 'text-[#1a7a3f] border-b-2 border-[#1a7a3f]'
                    : 'text-gray-500 hover:text-[#1a7a3f]'
                }`
              }
            >
              {label}
            </NavLink>
          </li>
        ))}
      </ul>

      {/* Profile Avatar + Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen((prev) => !prev)}
          className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200 hover:border-[#1a7a3f] transition-colors duration-200 focus:outline-none"
        >
          <img src={profileImg} alt="Profile" className="w-full h-full object-cover" />
        </button>

        {/* Dropdown Card */}
        {dropdownOpen && (
          <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-fade-in">
            {/* Profile Info */}
            <div className="flex flex-col items-center pt-6 pb-4 px-4 border-b border-gray-100">
              <div className="relative">
                <img
                  src={profileImg}
                  alt="James Bayo"
                  className="w-16 h-16 rounded-full object-cover border-2 border-white shadow"
                />
                {/* Green checkmark badge */}
                <span className="absolute bottom-0 right-0 w-5 h-5 bg-[#1a7a3f] rounded-full flex items-center justify-center border-2 border-white">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              </div>
              <p className="mt-3 font-semibold text-gray-900 text-[15px]">James Bayo</p>
              <p className="text-xs text-gray-400">Admin</p>
              <span className="mt-2 flex items-center gap-1.5 bg-green-100 text-green-600 text-xs font-medium px-3 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Online
              </span>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              <button className="w-full flex items-center justify-between px-5 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Settings
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <button className="w-full flex items-center justify-between px-5 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  Notifications
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Logout */}
            <div className="px-4 pb-5 pt-1">
              <button className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors duration-200">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                LOGOUT
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar