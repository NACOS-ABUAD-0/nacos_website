// src/pages/CollaborationHubPage.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useProjectsNeedingHelp } from '../lib/hooks/useCollaboration';
import { useTheme } from '../context/ThemeContext';
import Navbar from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ProjectCard } from '../components/ProjectCard';
import { Users, Filter, ArrowRight } from 'lucide-react';

const SKILL_FILTERS = [
  { value: '', label: 'All Skills' },
  { value: 'frontend', label: 'Frontend' },
  { value: 'backend', label: 'Backend' },
  { value: 'ui_ux', label: 'UI/UX' },
  { value: 'ai_ml', label: 'AI/ML' },
  { value: 'documentation', label: 'Documentation' },
  { value: 'others', label: 'Others' },
];

export const CollaborationHubPage: React.FC = () => {
  const { isDark } = useTheme();
  const [skillFilter, setSkillFilter] = useState('');
  const { data: projects, isLoading } = useProjectsNeedingHelp(skillFilter || undefined);

  return (
    <div className={`min-h-screen flex flex-col ${isDark ? 'bg-[#0a0f1e]' : 'bg-gray-50'}`}>
      <Navbar />
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Collaboration Hub
              </h1>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                Discover projects that need your skills and start collaborating
              </p>
            </div>
            <Link
              to="/projects/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              <Users className="w-4 h-4" />
              Post Your Project
            </Link>
          </div>
        </motion.div>

        {/* Skill Filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {SKILL_FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setSkillFilter(filter.value)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${
                skillFilter === filter.value
                  ? 'bg-green-500 text-white border-green-500'
                  : isDark
                  ? 'bg-[#161d2e] text-slate-300 border-white/[0.07] hover:border-white/[0.14]'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-green-300'
              }`}
            >
              {filter.value && <Filter className="w-3 h-3" />}
              {filter.label}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
          </div>
        )}

        {!isLoading && (!projects || projects.length === 0) && (
          <div className="text-center py-16">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-white/[0.04]' : 'bg-gray-100'}`}>
              <Users className={`w-8 h-8 ${isDark ? 'text-slate-600' : 'text-gray-300'}`} />
            </div>
            <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              No projects needing help
            </h3>
            <p className={`text-sm max-w-sm mx-auto ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              Check back later or be the first to post a project that needs collaborators.
            </p>
          </div>
        )}

        {!isLoading && projects && projects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <ProjectCard project={project} />
              </motion.div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};