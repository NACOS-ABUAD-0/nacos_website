import React, { useState } from 'react'
import Navbar from '../components/Navbar.jsx'
import { Footer } from '../../components/Footer.tsx'

// Placeholder event data 
const eventsData = Array.from({ length: 9 }, (_, i) => ({
  id: i + 1,
  name: 'Event Name',
  date: '25/11/26',
  time: '9:00pm',
  description:
    'Lorem ipsum dolor sit amet, consectet u adipiscing elit. Sed do eiusmod tempo inci didunt ut labore et dolore magnaaliqua.',
  image: null,
}))

//Three-dot menu 
const DotsMenu = ({ open, onToggle, onClose }) => {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="text-gray-400 hover:text-gray-600 p-1"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="5" cy="12" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="19" cy="12" r="1.5" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-7 w-36 bg-white rounded-xl shadow-lg border border-gray-100 z-20">
          <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">
            Edit
          </button>
          <button className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50">
            Delete
          </button>
        </div>
      )}
    </div>
  )
}

// Event Card 
const EventCard = ({ event }) => {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div
      className="bg-[#eef6f3] rounded-lg overflow-hidden flex flex-col 
                 max-w-[300px] w-full h-[400px] mb-8  mx-auto hover:shadow-md transition"
      onClick={() => menuOpen && setMenuOpen(false)}
    >
      {/* Image */}
      <div className="relative">
        {event.image ? (
          <img
            src={event.image}
            alt={event.name}
            className="w-full h-48 object-cover"
          />
        ) : (
          <div className="w-full h-48 bg-[#dcebe5]" />
        )}

        <div
          className="absolute top-3 right-3"
          onClick={(e) => e.stopPropagation()}
        >
          <DotsMenu
            open={menuOpen}
            onToggle={() => setMenuOpen(!menuOpen)}
            onClose={() => setMenuOpen(false)}
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex justify-between mb-2">
          <h3 className="text-[16px] font-bold text-[#000000]">
            {event.name}
          </h3>
          <span className="text-[12px] text-[#000000]">
            {event.date}, {event.time}
          </span>
        </div>

        <p className="text-[14px] w-[280px] text-[#000000] mt-3 flex-1">
          {event.description}
        </p>

        <button className="mx-auto bg-[#006e3a] text-white text-xs px-6 py-2 rounded-lg hover:bg-[#155f32]">
          View Gallery
        </button>
      </div>
    </div>
  )
}

// Main Component 
const Events = () => {
  const [showModal, setShowModal] = useState(false)

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8">

        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs px-8 py-7 mb-10 flex justify-between items-start">
          <div>
            <h1 className="text-[30px] font-extrabold text-[#1a7a3f] mb-2">
              EVENTS
            </h1>
            <p className="text-sm text-gray-500 max-w-md">
              Discover our exciting events that shape the future of NACOS and our body
            </p>
          </div>

          {/* ✅ FIXED BUTTON */}
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-[#1a7a3f] text-white px-3 py-2 rounded-lg text-sm w-fit shrink-0 hover:bg-[#155f32]"
          >
            <span className="text-base leading-none">+</span>
            Edit Events
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {eventsData.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-bold mb-4">Add Event</h2>

            <div className="flex flex-col gap-3">
              <input placeholder="Name" className="border p-2 rounded" />
              <input type="date" className="border p-2 rounded" />
              <input type="time" className="border p-2 rounded" />
              <textarea placeholder="Description" className="border p-2 rounded" />
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 border p-2 rounded"
              >
                Cancel
              </button>
              <button className="flex-1 bg-[#1a7a3f] text-white p-2 rounded">
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