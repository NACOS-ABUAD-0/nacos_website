// src/pages/LikedProjectsPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLikedProjects } from '../lib/hooks/useLikedProjects';
import { useTheme } from '../context/ThemeContext';
import Navbar from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ProjectCard } from '../components/ProjectCard';
import { Heart, ArrowLeft } from 'lucide-react';

export const LikedProjectsPage: React.FC = () => {
  const { isDark } = useTheme();
  const { data: likedProjects, isLoading, error } = useLikedProjects();

  return (
    <div className={`min-h-screen flex flex-col ${isDark ? 'bg-[#0a0f1e]' : 'bg-gray-50'}`}>
      <Navbar />
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="flex items-center gap-3 mb-8">
          <Link
            to="/dashboard"
            className={`p-2 rounded-lg border ${isDark ? 'border-white/[0.07] text-slate-400 hover:text-white' : 'border-gray-200 text-gray-600 hover:text-gray-900'} transition-colors`}
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Liked Projects
          </h1>
        </div>

        {isLoading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
          </div>
        )}

        {error && (
          <p className={`text-center ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
            Failed to load liked projects.
          </p>
        )}

        {!isLoading && !error && (!likedProjects || likedProjects.length === 0) && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${isDark ? 'bg-white/[0.04]' : 'bg-gray-100'}`}>
              <Heart className={`w-8 h-8 ${isDark ? 'text-slate-600' : 'text-gray-300'}`} />
            </div>
            <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>No liked projects yet</h3>
            <p className={`text-sm max-w-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              Browse the project showcase and like the ones that inspire you.
            </p>
            <Link
              to="/projects"
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              Browse Projects
            </Link>
          </div>
        )}

        {!isLoading && !error && likedProjects && likedProjects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {likedProjects.map((project) => (
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