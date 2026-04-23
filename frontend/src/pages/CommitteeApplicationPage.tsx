// src/pages/CommitteeApplicationPage.tsx
import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useCommittees, useApplyCommittee } from '../lib/hooks/useCommittees';
import { useStudentProfile } from '../lib/hooks/useStudentProfile';
import Navbar from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const CommitteeApplicationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const { data: committees } = useCommittees();
  const { data: studentProfile } = useStudentProfile();
  const { mutate: apply, isPending } = useApplyCommittee();

  const committee = committees?.find(c => c.id === Number(id));

  const [phone, setPhone] = useState(studentProfile?.phone_number || '');
  const [reason, setReason] = useState('');
  const [offer, setOffer] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || !reason.trim() || !offer.trim()) {
      toast.error('Please fill in all fields.');
      return;
    }
    apply(
      {
        committee_id: Number(id),
        phone_number: phone,
        reason,
        offer,
      },
      {
        onSuccess: () => {
          toast.success('Application submitted successfully!');
          navigate('/committees');
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.detail || err?.response?.data?.error || 'Failed to submit application.';
          toast.error(msg);
        },
      }
    );
  };

  if (!committee) {
    return (
      <div className={`min-h-screen flex flex-col ${isDark ? 'bg-[#0a0f1e]' : 'bg-gray-50'}`}>
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <p className={isDark ? 'text-slate-400' : 'text-gray-500'}>Committee not found.</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col ${isDark ? 'bg-[#0a0f1e]' : 'bg-gray-50'}`}>
      <Navbar />
      <main className="flex-grow max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="flex items-center gap-3 mb-6">
          <Link
            to="/committees"
            className={`p-2 rounded-lg border ${isDark ? 'border-white/[0.07] text-slate-400 hover:text-white' : 'border-gray-200 text-gray-600 hover:text-gray-900'} transition-colors`}
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Apply to {committee.name}
          </h1>
        </div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          onSubmit={handleSubmit}
          className={`p-6 sm:p-8 border rounded-2xl ${isDark ? 'bg-[#161d2e] border-white/[0.07]' : 'bg-white border-gray-100'}`}
        >
          <div className="space-y-5">
            {/* Full Name (auto-filled) */}
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                Full Name
              </label>
              <input
                type="text"
                value={user?.full_name || ''}
                disabled
                className={`w-full px-3 py-2.5 rounded-xl border text-sm ${isDark ? 'bg-white/[0.04] border-white/[0.07] text-slate-400' : 'bg-gray-50 border-gray-200 text-gray-500'} cursor-not-allowed`}
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 08012345678"
                className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all ${isDark ? 'bg-white/[0.04] border-white/[0.07] text-white placeholder:text-slate-600' : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'}`}
              />
            </div>

            {/* Reason */}
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                Reason for Joining <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter anything"
                className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all resize-none ${isDark ? 'bg-white/[0.04] border-white/[0.07] text-white placeholder:text-slate-600' : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'}`}
              />
              <p className={`text-[11px] mt-1 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                Enter anything — no pressure, just share your motivation.
              </p>
            </div>

            {/* What You Offer */}
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                What You Have to Offer <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={offer}
                onChange={(e) => setOffer(e.target.value)}
                placeholder="Enter anything"
                className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all resize-none ${isDark ? 'bg-white/[0.04] border-white/[0.07] text-white placeholder:text-slate-600' : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'}`}
              />
              <p className={`text-[11px] mt-1 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                Enter anything — skills, ideas, or just your enthusiasm.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-colors"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Submit Application
              </button>
            </div>
          </div>
        </motion.form>
      </main>
      <Footer />
    </div>
  );
};