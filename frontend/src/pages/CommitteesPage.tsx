// src/pages/CommitteesPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCommittees, useCommitteeApplications } from '../lib/hooks/useCommittees';
import { useTheme } from '../context/ThemeContext';
import Navbar from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Users, ArrowRight, CheckCircle2, Clock } from 'lucide-react';

export const CommitteesPage: React.FC = () => {
  const { isDark } = useTheme();
  const { data: committees, isLoading } = useCommittees();
  const { data: myApplications } = useCommitteeApplications();

  const appliedCommitteeIds = new Set(myApplications?.map(a => a.committee.id) || []);

  return (
    <div className={`min-h-screen flex flex-col ${isDark ? 'bg-[#0a0f1e]' : 'bg-gray-50'}`}>
      <Navbar />
      <main className="flex-grow max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Committees
          </h1>
          <p className={`text-sm mb-8 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
            Join a committee to contribute to the NACOS community and build your leadership skills.
          </p>
        </motion.div>

        {isLoading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {committees?.map((committee, idx) => {
            const hasApplied = appliedCommitteeIds.has(committee.id);
            return (
              <motion.div
                key={committee.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1, duration: 0.4 }}
                className={`p-5 sm:p-6 border rounded-2xl ${isDark ? 'bg-[#161d2e] border-white/[0.07]' : 'bg-white border-gray-100'} transition-all hover:shadow-md`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-green-500/10' : 'bg-green-100'}`}>
                    <Users className={`w-5 h-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                  </div>
                  {hasApplied ? (
                    <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full ${isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>
                      <Clock className="w-3 h-3" /> Applied
                    </span>
                  ) : null}
                </div>
                <h3 className={`text-lg font-bold mt-4 mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {committee.name}
                </h3>
                <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                  {committee.description}
                </p>
                <div className="mt-5">
                  {hasApplied ? (
                    <button
                      disabled
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border ${isDark ? 'border-white/[0.07] text-slate-500' : 'border-gray-200 text-gray-400'} cursor-not-allowed`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Application Submitted
                    </button>
                  ) : (
                    <Link
                      to={`/committees/${committee.id}/apply`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition-colors"
                    >
                      Apply Now <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </main>
      <Footer />
    </div>
  );
};