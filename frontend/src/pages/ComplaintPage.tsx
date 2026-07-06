// src/pages/ComplaintPage.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';
import { useMyComplaints, useSubmitComplaint } from '../lib/hooks/useComplaints';
import Navbar from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Send, Loader2, ShieldOff, Clock } from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  dismissed: 'Dismissed',
};

const STATUS_STYLES: Record<string, string> = {
  new: 'bg-amber-100 text-amber-700',
  in_progress: 'bg-blue-100 text-blue-700',
  resolved: 'bg-green-100 text-green-700',
  dismissed: 'bg-gray-100 text-gray-500',
};

export const ComplaintPage: React.FC = () => {
  const { isDark } = useTheme();
  const { data: myComplaints, isLoading } = useMyComplaints();
  const { mutate: submit, isPending } = useSubmitComplaint();

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.error('Please fill in both the subject and message.');
      return;
    }
    submit(
      { subject, message, is_anonymous: isAnonymous },
      {
        onSuccess: () => {
          toast.success('Complaint submitted.');
          setSubject('');
          setMessage('');
          setIsAnonymous(false);
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.detail || err?.response?.data?.error || 'Failed to submit complaint.';
          toast.error(msg);
        },
      }
    );
  };

  return (
    <div className={`min-h-screen flex flex-col ${isDark ? 'bg-[#0a0f1e]' : 'bg-gray-50'}`}>
      <Navbar />
      <main className="flex-grow max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <h1 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Submit a Complaint
        </h1>
        <p className={`text-sm mb-8 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
          Tell us about an issue. You can choose to stay anonymous.
        </p>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          onSubmit={handleSubmit}
          className={`p-6 sm:p-8 border rounded-2xl ${isDark ? 'bg-[#161d2e] border-white/[0.07]' : 'bg-white border-gray-100'}`}
        >
          <div className="space-y-5">
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Broken projector in the lab"
                className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all ${isDark ? 'bg-white/[0.04] border-white/[0.07] text-white placeholder:text-slate-600' : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'}`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe the issue in as much detail as you can."
                className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all resize-none ${isDark ? 'bg-white/[0.04] border-white/[0.07] text-white placeholder:text-slate-600' : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'}`}
              />
            </div>

            {/* Anonymous toggle */}
            <div className={`flex items-start gap-3 p-4 rounded-xl border ${isDark ? 'bg-white/[0.03] border-white/[0.07]' : 'bg-gray-50 border-gray-200'}`}>
              <button
                type="button"
                role="switch"
                aria-checked={isAnonymous}
                onClick={() => setIsAnonymous((prev) => !prev)}
                className={`relative shrink-0 w-11 h-6 rounded-full transition-colors ${isAnonymous ? 'bg-green-600' : isDark ? 'bg-white/10' : 'bg-gray-300'}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isAnonymous ? 'translate-x-5' : 'translate-x-0'}`}
                />
              </button>
              <div>
                <p className={`text-sm font-medium flex items-center gap-1.5 ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>
                  <ShieldOff className="w-4 h-4" />
                  Submit anonymously
                </p>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                  If enabled, this cannot be traced back to you — not even by admins.
                  Because of that, you also won't be able to see updates on it afterward.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-colors"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Submit Complaint
              </button>
            </div>
          </div>
        </motion.form>

        {/* Past non-anonymous complaints */}
        {!isLoading && myComplaints && myComplaints.length > 0 && (
          <div className="mt-10">
            <h2 className={`text-sm font-semibold uppercase tracking-wide mb-3 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              Your Past Complaints
            </h2>
            <div className="space-y-3">
              {myComplaints.map((c) => (
                <div
                  key={c.id}
                  className={`p-4 rounded-xl border ${isDark ? 'bg-[#161d2e] border-white/[0.07]' : 'bg-white border-gray-100'}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {c.subject}
                    </h3>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${STATUS_STYLES[c.status]}`}>
                      {STATUS_LABELS[c.status]}
                    </span>
                  </div>
                  <p className={`text-xs mt-1 flex items-center gap-1 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                    <Clock className="w-3 h-3" />
                    {new Date(c.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};
