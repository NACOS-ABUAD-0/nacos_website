import React, { useState } from 'react'
import Navbar from '../components/Navbar.jsx'
import { Footer } from '../../components/Footer.tsx'

// ── Placeholder event data ─────────────────────────────────────
const eventsData = Array.from({ length: 9 }, (_, i) => ({
  id: i + 1,
  name: 'Event Name',
  date: '25/11/26',
  time: '9:00pm',
  description:
    'Lorem ipsum dolor sit amet, consectet u adipiscing elit. Sed do eiusmod tempo inci didunt ut labore et dolore magnaaliqua.',
  image: null,
}))

// ── Three-dot menu ─────────────────────────────────────────────
const DotsMenu = ({ open, onToggle, onClose }) => {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="5" cy="12" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="19" cy="12" r="1.5" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-7 w-36 bg-white rounded-xl shadow-lg border border-gray-100 z-20 overflow-hidden">
          <button
            onClick={onClose}
            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            Edit
          </button>
          <button
            onClick={onClose}
            className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 flex items-center gap-2"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  )
}

// ── Event Card ─────────────────────────────────────────────────
const EventCard = ({ event }) => {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col bg-[#eef6f3] hover:shadow-md transition-shadow duration-200"
      onClick={() => menuOpen && setMenuOpen(false)}
    >
      {/* Image area */}
      <div className="relative">
        {event.image ? (
          <img
            src={event.image}
            alt={event.name}
            className="w-full h-56 object-cover"
          />
        ) : (
          <div className="w-full h-56 bg-[#dcebe5]" />
        )}

        {/* Menu */}
        <div
          className="absolute top-3 right-3"
          onClick={(e) => e.stopPropagation()}
        >
          <DotsMenu
            open={menuOpen}
            onToggle={() => setMenuOpen((p) => !p)}
            onClose={() => setMenuOpen(false)}
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 text-[16px]">
            {event.name}
          </h3>

          <span className="text-[11px] text-gray-500 whitespace-nowrap">
            {event.date}, {event.time}
          </span>
        </div>

        <p className="text-[12px] text-gray-500 leading-relaxed mb-5 flex-1">
          {event.description}
        </p>

        <button className="mx-auto bg-[#1a7a3f] hover:bg-[#155f32] text-white text-xs font-semibold px-6 py-2.5 rounded-lg transition-all duration-200">
          View Gallery
        </button>
      </div>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────
const Events = () => {
  const [showModal, setShowModal] = useState(false)

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
        
        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-8 py-7 mb-10 flex items-start justify-between">
          <div>
            <h1 className="text-[30px] font-extrabold text-[#1a7a3f] mb-2">
              EVENTS
            </h1>
            <p className="text-sm text-gray-500 max-w-md">
              Discover our exciting events that shape the future of NACOS and our body
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-[#1a7a3f] hover:bg-[#155f32] text-white text-sm font-semibold px-4 py-2.5 rounded-xl"
          >
            + Edit Events
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {eventsData.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between mb-5">
              <h2 className="text-lg font-bold">Add New Event</h2>
              <button onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="Event Name"
                className="border rounded-lg px-3 py-2"
              />
              <div className="grid grid-cols-2 gap-3">
                <input type="date" className="border rounded-lg px-3 py-2" />
                <input type="time" className="border rounded-lg px-3 py-2" />
              </div>
              <textarea
                placeholder="Description"
                className="border rounded-lg px-3 py-2"
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 border rounded-lg py-2"
              >
                Cancel
              </button>
              <button className="flex-1 bg-[#1a7a3f] text-white rounded-lg py-2">
                Save
              </button>
            </div>
          </div>
        </div>
      
      )}
        <Footer />
    </div>
  )
}

export default Events