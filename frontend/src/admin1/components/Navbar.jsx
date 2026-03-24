import React from 'react'
import { NavLink } from 'react-router-dom'
import Logo from '../../assets/nacos_logo.png'

const Navbar = () => {
  return (
    <nav className="flex flex-row items-center justify-between px-10 py-4 border-b border-gray-200 bg-white sticky top-0 z-50">
      {/* Logo + Brand */}
      <div className="flex flex-row items-center gap-2">
        <img src={Logo} alt="NACOS Logo" className="w-10 h-10" />
        <h1 className="text-[18px] font-bold text-[#000000] tracking-wide">NACOS ABUAD</h1>
      </div>

      {/* Nav Links */}
      <ul className="flex items-center gap-8">
        {[
          { label: 'Home', to: '/admin' },
          { label: 'CRUD', to: '/admin/crud' },
          { label: 'Events', to: '/admin/events' },
          { label: 'Metrics', to: '/admin/metrics' },
          { label: 'Approvals', to: '/admin/approvals' },
        ].map(({ label, to }) => (
          <li key={label}>
            <NavLink
              to={to}
              end={to === '/admin'}
              className={({ isActive }) =>
                `text-[15px] font-medium pb-1 transition-colors duration-200 ${
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

      {/* Profile Avatar Placeholder */}
      <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden flex items-center justify-center cursor-pointer border-2 border-gray-200 hover:border-[#1a7a3f] transition-colors duration-200">
        {/* Replace with actual user image once auth is set up */}
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
    </nav>
  )
}

export default Navbar