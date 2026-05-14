// src/admin1/components/Navbar.tsx

import React, { useState, useRef, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import Logo from '../../assets/nacos_logo.png'
import profileImg from '../../assets/profile.png'

const NAV_LINKS = [
  { label: 'Home',                   to: '/admin' },
  { label: 'Events',                 to: '/admin/events' },
  { label: 'Metrics',                to: '/admin/metrics' },
  { label: 'Approvals',              to: '/admin/approvals' },
  { label: 'Committee Applications', to: '/admin/committee-applications' },
  { label: 'Gallery',                to: '/admin/gallery' },
  { label: 'Inquiries',              to: '/admin/inquiries' },
  { label: 'User Management',        to: '/admin/users' },
]

const Navbar: React.FC = () => {
  const [dropdownOpen, setDropdownOpen]   = useState<boolean>(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false)
  const dropdownRef  = useRef<HTMLDivElement>(null)
  const navigate     = useNavigate()

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileMenuOpen])

  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <>
      <nav className="flex flex-row items-center justify-between px-4 md:px-10 py-4 border-b border-gray-200 bg-white sticky top-0 z-50">

        {/* Logo + Brand */}
        <div className="flex flex-row items-center gap-2">
          <img src={Logo} alt="NACOS Logo" className="w-9 h-9 md:w-10 md:h-10" />
          <h1 className="text-[15px] md:text-[18px] font-bold text-black tracking-wide">NACOS ABUAD</h1>
        </div>

        {/* Desktop Nav Links */}
        <ul className="hidden md:flex items-center gap-6 lg:gap-8">
          {NAV_LINKS.map(({ label, to }) => (
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

        {/* Right side: profile avatar + hamburger */}
        <div className="flex items-center gap-3">

          {/* Profile Avatar + Dropdown (visible on all sizes) */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200 hover:border-[#1a7a3f] transition-colors duration-200 focus:outline-none"
            >
              <img src={profileImg} alt="Profile" className="w-full h-full object-cover" />
            </button>

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
                  <button
                    onClick={() => { setDropdownOpen(false); navigate('/admin/settings') }}
                    className="w-full flex items-center justify-between px-5 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
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

          {/* Hamburger Button — mobile only */}
          <button
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle menu"
            className="md:hidden flex flex-col justify-center items-center w-10 h-10 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none gap-[5px]"
          >
            {/* Animated hamburger → X */}
            <span
              className={`block h-0.5 w-5 bg-gray-700 rounded transition-all duration-300 origin-center ${
                mobileMenuOpen ? 'rotate-45 translate-y-[7px]' : ''
              }`}
            />
            <span
              className={`block h-0.5 w-5 bg-gray-700 rounded transition-all duration-300 ${
                mobileMenuOpen ? 'opacity-0 scale-x-0' : ''
              }`}
            />
            <span
              className={`block h-0.5 w-5 bg-gray-700 rounded transition-all duration-300 origin-center ${
                mobileMenuOpen ? '-rotate-45 -translate-y-[7px]' : ''
              }`}
            />
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      {/* Mobile Slide-in Drawer */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 max-w-[85vw] bg-white z-50 shadow-2xl flex flex-col md:hidden
          transform transition-transform duration-300 ease-in-out
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <img src={Logo} alt="NACOS Logo" className="w-8 h-8" />
            <span className="font-bold text-[15px] text-black tracking-wide">NACOS ABUAD</span>
          </div>
          <button
            onClick={closeMobileMenu}
            aria-label="Close menu"
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 overflow-y-auto py-3">
          <ul className="flex flex-col">
            {NAV_LINKS.map(({ label, to }) => (
              <li key={label}>
                <NavLink
                  to={to}
                  end={to === '/admin'}
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-5 py-3.5 text-[14px] font-medium transition-colors duration-150 ${
                      isActive
                        ? 'text-[#1a7a3f] bg-green-50 border-l-4 border-[#1a7a3f]'
                        : 'text-gray-600 hover:text-[#1a7a3f] hover:bg-gray-50 border-l-4 border-transparent'
                    }`
                  }
                >
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Drawer Footer — Logout */}
        <div className="px-5 py-5 border-t border-gray-100">
          <button className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors duration-200">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            LOGOUT
          </button>
        </div>
      </aside>
    </>
  )
}

export default Navbar