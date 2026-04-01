// src/pages/contact.tsx
import { useState } from 'react'
import Navbar from '../components/Navbar'
import { Footer } from '../components/Footer'
import { useSubmitInquiry, type InquiryType } from '../lib/hooks/useInquiries'
import toast from 'react-hot-toast'

import {
  Mail,
  MapPin,
  Twitter,
  Instagram,
  MessageSquare,
  Handshake,
  Link2,
  Target,
  CheckCircle,
  Send,
  Download
} from 'lucide-react'

const TABS = [
  { label: 'General', value: 'general', icon: MessageSquare },
  { label: 'Sponsorship', value: 'sponsorship', icon: Handshake },
  { label: 'Partnership', value: 'partnership', icon: Link2 },
  { label: 'Recruitment', value: 'recruitment', icon: Target },
]

const BUDGET_OPTIONS = [
  'Under ₦100,000',
  '₦100,000 – ₦500,000',
  '₦500,000 – ₦1,000,000',
  'Above ₦1,000,000',
  'Open to discussion',
]

const PACKAGE_OPTIONS = [
  'Title Sponsor',
  'Gold Sponsor',
  'Silver Sponsor',
  'Bronze Sponsor',
  'Event Partner',
  'Media Partner',
  'Other',
]

const EMPTY = {
  name: '',
  email: '',
  organization: '',
  subject: '',
  message: '',
  budget_range: '',
  package_interest: '',
  website_url: '',
}

export default function ContactPage() {
  const [tab, setTab] = useState<InquiryType>('general')
  const [form, setForm] = useState(EMPTY)
  const [sent, setSent] = useState(false)

  const mutation = useSubmitInquiry()
  const set = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }))
  const isSponsorship = tab === 'sponsorship' || tab === 'partnership'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.message) {
      toast.error('Please fill in all required fields.')
      return
    }
    try {
      await mutation.mutateAsync({ ...form, type: tab })
      setSent(true)
    } catch {
      toast.error('Failed to send message. Please try again.')
    }
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">

        {/* HERO */}
        <div className="bg-gradient-to-br from-[#006E3A] to-[#004d28] text-white py-24 px-6 text-center">
          <h1 className="text-5xl font-extrabold mb-4 tracking-tight">
            Get In Touch
          </h1>

          <p className="text-green-100 max-w-xl mx-auto text-lg">
            Partner with NACOS ABUAD, sponsor events, or reach out directly.
          </p>

          <a
            href="/nacos-sponsorship-deck.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-10 bg-white text-[#006E3A] font-semibold px-6 py-3 rounded-xl hover:bg-green-50 transition shadow-lg"
          >
            <Download className="w-5 h-5" />
            Sponsorship Deck
          </a>
        </div>

        {/* CONTENT */}
        <div className="max-w-6xl mx-auto px-4 py-20 grid grid-cols-1 lg:grid-cols-3 gap-12">

          {/* LEFT PANEL */}
          <div className="space-y-6">

            {[
              { icon: Mail, label: 'Email', value: 'nacosabuad1@gmail.com' },
              { icon: MapPin, label: 'Location', value: 'ABUAD, Ado-Ekiti' },
              { icon: Twitter, label: 'Twitter/X', value: '@nacos_abuad' },
              { icon: Instagram, label: 'Instagram', value: '@nacos_abuad' },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-start gap-4">
                <item.icon className="w-5 h-5 text-[#006E3A]" />
                <div>
                  <p className="text-xs uppercase text-gray-400 font-semibold">{item.label}</p>
                  <p className="text-sm text-gray-800 font-medium">{item.value}</p>
                </div>
              </div>
            ))}

            {/* VALUE BOX */}
            <div className="bg-[#006E3A] text-white rounded-2xl p-6">
              <h3 className="font-bold text-lg mb-3">Why Partner With Us</h3>
              <ul className="space-y-2 text-sm text-green-100">
                {[
                  '500+ computing students',
                  'High-visibility events',
                  'Direct access to talent',
                  'Strong campus presence',
                  'Community impact',
                ].map(item => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="lg:col-span-2">

            {sent ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                <CheckCircle className="w-14 h-14 text-[#006E3A] mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Message Sent</h2>
                <p className="text-gray-500 mb-6">
                  We will get back to you within 2–3 business days.
                </p>
                <button
                  onClick={() => { setSent(false); setForm(EMPTY) }}
                  className="bg-[#006E3A] text-white px-6 py-2 rounded-lg hover:bg-green-800"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">

                {/* TABS */}
                <div className="flex flex-wrap gap-2 mb-8">
                  {TABS.map(t => (
                    <button
                      key={t.value}
                      onClick={() => setTab(t.value)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition ${
                        tab === t.value
                          ? 'bg-[#006E3A] text-white shadow'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <t.icon className="w-4 h-4" />
                      {t.label}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">

                  <div className="grid sm:grid-cols-2 gap-4">
                    <input
                      placeholder="Full Name"
                      value={form.name}
                      onChange={e => set('name', e.target.value)}
                      className="input"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={form.email}
                      onChange={e => set('email', e.target.value)}
                      className="input"
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <input
                      placeholder="Organization"
                      value={form.organization}
                      onChange={e => set('organization', e.target.value)}
                      className="input"
                    />
                    <input
                      placeholder="Subject"
                      value={form.subject}
                      onChange={e => set('subject', e.target.value)}
                      className="input"
                    />
                  </div>

                  {isSponsorship && (
                    <div className="grid sm:grid-cols-2 gap-4 p-4 bg-green-50 rounded-xl border">
                      <select
                        value={form.budget_range}
                        onChange={e => set('budget_range', e.target.value)}
                        className="input"
                      >
                        <option value="">Budget Range</option>
                        {BUDGET_OPTIONS.map(o => <option key={o}>{o}</option>)}
                      </select>

                      <select
                        value={form.package_interest}
                        onChange={e => set('package_interest', e.target.value)}
                        className="input"
                      >
                        <option value="">Package Interest</option>
                        {PACKAGE_OPTIONS.map(o => <option key={o}>{o}</option>)}
                      </select>

                      <input
                        placeholder="Website"
                        value={form.website_url}
                        onChange={e => set('website_url', e.target.value)}
                        className="input sm:col-span-2"
                      />
                    </div>
                  )}

                  <textarea
                    rows={5}
                    placeholder="Your message"
                    value={form.message}
                    onChange={e => set('message', e.target.value)}
                    className="input resize-none"
                  />

                  <button
                    type="submit"
                    disabled={mutation.isPending}
                    className="w-full bg-[#006E3A] text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-green-800 transition"
                  >
                    <Send className="w-4 h-4" />
                    {mutation.isPending ? 'Sending...' : 'Send Message'}
                  </button>

                </form>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}