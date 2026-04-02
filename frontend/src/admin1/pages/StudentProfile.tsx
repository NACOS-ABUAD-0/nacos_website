// src/admin1/pages/StudentProfile.tsx

import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import project1 from '../../assets/profile1.png'
import project2 from '../../assets/profile2.png'
import { Footer } from '../../components/Footer'

interface Student {
  id?: number
  fullName?: string
  email?: string
  matricNo?: string
  level?: number
  status?: 'Active' | 'Pending' | 'Banned'
}

interface Project {
  id: number
  image: string
  name: string
  description: string
}

interface LocationState {
  student?: Student
}

const PROJECTS: Project[] = [
  {
    id: 1,
    image: project1,
    name: 'Project Name',
    description:
      'Lorem ipsum dolor sit amet, consectetuadipiscing elit. Sed do eiusmod tempo incididunt ut labore et dolore magna aliqua. Vitae susc ipit vel vel facilisis venenatis. Semper risus in hendrerit gravida rutrum quisque non tellus.',
  },
  {
    id: 2,
    image: project2,
    name: 'Project Name',
    description:
      'Lorem ipsum dolor sit amet, consectetuadipiscing elit. Sed do eiusmod tempo incididunt ut labore et dolore magna aliqua. Vitae susc ipit vel vel facilisis venenatis. Semper risus in hendrerit gravida rutrum quisque non tellus.',
  },
]

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-start gap-4 mb-4">
    <span className="text-[13px] text-gray-400 w-28 shrink-0">{label}</span>
    <span className="text-[13px] text-gray-800 font-medium">{value}</span>
  </div>
)

const ProjectCard: React.FC<{ project: Project }> = ({ project }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
    <img src={project.image} alt={project.name} className="w-full object-cover" style={{ height: '260px' }} />
    <div className="p-5 flex flex-col flex-1">
      <h3 className="text-[15px] font-bold text-[#1a7a3f] mb-2">{project.name}</h3>
      <p className="text-[12px] text-gray-500 leading-relaxed flex-1 mb-5">{project.description}</p>
      <button className="w-full bg-[#1a7a3f] hover:bg-[#155f32] text-white text-sm font-medium py-2.5 rounded-lg transition-colors duration-200">
        View Project
      </button>
    </div>
  </div>
)

export default function StudentProfile(): React.ReactElement {
  const navigate = useNavigate()
  const location = useLocation()
  const state    = location.state as LocationState | null
  const student  = state?.student

  const name         = student?.fullName ?? 'Olasumbo Nissi'
  const email        = student?.email    ?? 'OlasumboNissi@gmail.com'
  const matricNo     = student?.matricNo ?? '+44676987759'
  const level        = student?.level    ?? 400
  const status       = student?.status   ?? 'Active'
  const availability = level >= 500 ? 'Graduated' : 'Available'

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 hover:text-[#1a7a3f] text-[20px] font-semibold mb-6 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {name}
        </button>

        <div className="bg-white rounded-2xl p-6 md:p-8 mb-8">
          <div className="flex flex-row items-stretch gap-8">
            <div className="flex items-center justify-center shrink-0">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center border-2 border-gray-200 overflow-hidden">
                <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
            <div className="w-px bg-gray-200 self-stretch" />
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-16 pt-1">
              <div>
                <InfoRow label="Name"          value={name} />
                <InfoRow label="Email"         value={email} />
                <InfoRow label="Matric Number" value={matricNo} />
              </div>
              <div>
                <InfoRow label="Level"        value={String(level)} />
                <InfoRow label="Availability" value={availability} />
                <div className="flex items-start gap-4 mt-0">
                  <span className="text-[13px] text-gray-400 w-28 shrink-0">Status</span>
                  <span className={`px-3 py-0.5 rounded-full text-xs font-semibold ${
                    status === 'Banned'  ? 'bg-red-100 text-red-600' :
                    status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <h2 className="text-[20px] font-semibold mb-6">Projects Done</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-10">
          {PROJECTS.map((p) => <ProjectCard key={p.id} project={p} />)}
        </div>
      </main>
      <Footer />
    </div>
  )
}