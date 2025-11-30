// src/components/home/StatsStrip.tsx
import React from 'react';
import type { Stats } from '../../lib/hooks/useHomepage';
import { StatsSkeleton } from './Skeletons';

interface StatsStripProps {
  stats?: Stats;
  isLoading: boolean;
  error?: unknown;
}

const fallbackStats: Stats = {
  students: 250,
  projects: 120,
  skills: 45,
  events: 36,
  resources: 180
};

export const StatsStrip: React.FC<StatsStripProps> = ({ stats, isLoading, error }) => {
  const displayStats = stats || fallbackStats;

  if (isLoading) {
    return (
      <section className="py-12 bg-gradient-to-r from-gray-50 to-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <StatsSkeleton />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-12 bg-gradient-to-r from-gray-50 to-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-3 text-gray-500 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-2xl border border-gray-200">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium">Statistics temporarily unavailable</span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gradient-to-r from-white via-green-50/30 to-white border-y border-gray-100 relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%230f766e' fill-opacity='0.1'%3E%3Cpath d='M20 20c0-2.2 1.8-4 4-4s4 1.8 4 4-1.8 4-4 4-4-1.8-4-4z'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      {/* Floating accent elements */}
      <div className="absolute top-4 left-10 w-3 h-3 bg-green-300 rounded-full opacity-20 animate-pulse"></div>
      <div className="absolute bottom-6 right-16 w-2 h-2 bg-teal-400 rounded-full opacity-30"></div>

      <div className="max-w-7xl mx-auto px-4 relative">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 text-center">
          {[
            { value: displayStats.students, label: 'Students', icon: '👥' },
            { value: displayStats.projects, label: 'Projects', icon: '🚀' },
            { value: displayStats.skills, label: 'Skills', icon: '🛠️' },
            { value: displayStats.events, label: 'Events', icon: '📅' },
            { value: displayStats.resources, label: 'Resources', icon: '📚' }
          ].map((stat, index) => (
            <div
              key={stat.label}
              className="group relative"
            >
              {/* Hover effect background */}
              <div className="absolute inset-0 bg-white rounded-2xl shadow-sm group-hover:shadow-lg transition-all duration-300 scale-95 group-hover:scale-100 opacity-0 group-hover:opacity-100"></div>

              <div className="relative p-6">
                {/* Animated counter effect placeholder */}
                <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent mb-3">
                  {stat.value}+
                </div>

                {/* Icon with subtle animation */}
                <div className="text-2xl mb-3 group-hover:scale-110 transition-transform duration-300">
                  {stat.icon}
                </div>

                {/* Label with enhanced typography */}
                <div className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  {stat.label}
                </div>

                {/* Subtle accent line */}
                <div className="w-8 h-0.5 bg-gradient-to-r from-green-400 to-teal-400 rounded-full mx-auto mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Section subtitle */}
        <div className="text-center mt-12">
          <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">
            Growing Community • Active Development • Continuous Learning
          </p>
        </div>
      </div>
    </section>
  );
};