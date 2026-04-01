// src/pages/ProjectsGallery.tsx
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { useProjects, useSkills } from '../lib/hooks/useProjects';
import { ProjectCard } from '../components/ProjectCard';
import Navbar from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ========== Animation Variants ==========
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const cardHover = {
  hover: {
    y: -6,
    scale: 0.92,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
  tap: {
    scale: 0.98,
    transition: { duration: 0.1 },
  },
};

const buttonPress = {
  hover: { scale: 1.02 },
  tap: { scale: 0.96 },
};

const tagButtonHover = {
  hover: { scale: 1.05 },
  tap: { scale: 0.95 },
};

const spinTransition = {
  repeat: Infinity,
  duration: 1,
  ease: "linear",
};

export const ProjectsGallery: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [filters, setFilters] = useState({
    search: '',
    tag_names: '',
  });

  const { data: projects, isLoading, error } = useProjects(filters);
  const { data: skills } = useSkills();
  const { isAuthenticated } = useAuth();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({
      search: searchTerm,
      tag_names: selectedTags.map(id =>
        skills?.find(s => s.id === id)?.name
      ).filter(Boolean).join(','),
    });
  };

  const handleTagToggle = (tagId: number) => {
    const newTags = selectedTags.includes(tagId)
      ? selectedTags.filter(id => id !== tagId)
      : [...selectedTags, tagId];
    setSelectedTags(newTags);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedTags([]);
    setFilters({ search: '', tag_names: '' });
  };

  // For scroll reveal on cards
  const cardsRef = useRef<HTMLDivElement>(null);
  const isCardsInView = useInView(cardsRef, { once: true, amount: 0.2 });

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header with entrance animation */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-12"
          >
            <motion.div variants={fadeUp}>
              <motion.h1
                className="text-4xl font-bold tracking-tight text-gray-900"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                Project Showcase
              </motion.h1>
              <motion.p
                className="text-lg text-gray-500 mt-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Discover innovative projects built by ABUAD computing students
              </motion.p>
            </motion.div>

            {isAuthenticated && (
              <motion.div variants={fadeUp} whileHover="hover" whileTap="tap" variants={buttonPress}>
                <Link
                  to="/projects/new"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-teal-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Project
                </Link>
              </motion.div>
            )}
          </motion.div>

          {/* Filter Section with entrance animation */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-12"
          >
            <form onSubmit={handleSearch} className="space-y-6">
              {/* Search */}
              <div>
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                  Search repositories
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Find a repository..."
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Skills / Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Technologies & Skills
                </label>
                <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-xl border border-gray-200 min-h-16">
                  {skills?.map((skill) => (
                    <motion.button
                      key={skill.id}
                      type="button"
                      onClick={() => handleTagToggle(skill.id)}
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${
                        selectedTags.includes(skill.id)
                          ? 'bg-green-500 text-white border-green-500 shadow-sm scale-105'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-green-300 hover:bg-green-50'
                      }`}
                      whileHover="hover"
                      whileTap="tap"
                      variants={tagButtonHover}
                    >
                      <span>{skill.name}</span>
                      {selectedTags.includes(skill.id) && (
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </motion.button>
                  ))}
                  {skills?.length === 0 && (
                    <p className="text-gray-500 text-sm">No skills available</p>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  {selectedTags.length > 0 && `${selectedTags.length} skill${selectedTags.length !== 1 ? 's' : ''} selected`}
                </div>
                <div className="flex gap-3">
                  <motion.button
                    type="button"
                    onClick={clearFilters}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Clear filters
                  </motion.button>
                  <motion.button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-teal-600 rounded-lg hover:shadow-md transition-all duration-200"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Apply filters
                  </motion.button>
                </div>
              </div>
            </form>
          </motion.div>

          {/* Results */}
          <AnimatePresence mode="wait">
            {isLoading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex justify-center py-12"
              >
                <div className="text-center">
                  <motion.div
                    className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"
                    animate={{ rotate: 360 }}
                    transition={spinTransition}
                  />
                  <p className="text-gray-600">Loading projects...</p>
                </div>
              </motion.div>
            )}

            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg"
              >
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-red-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-medium text-red-800">Error loading projects</h3>
                    <p className="text-sm text-red-700 mt-1">
                      There was a problem loading the projects. Please try again.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {projects && !isLoading && !error && (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Results header */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <div>
                    <motion.h2
                      className="text-lg font-semibold text-gray-900"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      {projects.count || projects.length}
                      <span className="text-gray-500 font-normal ml-1">
                        project{(projects.count || projects.length) !== 1 ? 's' : ''} found
                      </span>
                    </motion.h2>
                    {filters.search && (
                      <motion.p
                        className="text-sm text-gray-500 mt-1"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        Matching "{filters.search}"
                      </motion.p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>Sort by:</span>
                    <select className="border-0 bg-transparent text-gray-900 font-medium focus:ring-0 focus:outline-none">
                      <option>Last updated</option>
                      <option>Name</option>
                      <option>Most stars</option>
                    </select>
                  </div>
                </div>

                {/* Projects grid */}
                {projects.results?.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="text-center py-16 bg-white rounded-2xl border border-gray-100"
                  >
                    <div className="w-24 h-24 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects found</h3>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">
                      {filters.search || selectedTags.length > 0
                        ? "Try adjusting your search criteria or filters to find what you're looking for."
                        : "Be the first to showcase your project and inspire the community."
                      }
                    </p>
                    {isAuthenticated && !filters.search && selectedTags.length === 0 && (
                      <motion.div whileHover="hover" whileTap="tap" variants={buttonPress}>
                        <Link
                          to="/projects/new"
                          className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-teal-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Create first project
                        </Link>
                      </motion.div>
                    )}
                  </motion.div>
                ) : (
                  <div
                    ref={cardsRef}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  >
                    {projects.results?.map((project, index) => (
                      <motion.div
                        key={project.id}
                        variants={fadeUp}
                        initial="hidden"
                        animate={isCardsInView ? "visible" : "hidden"}
                        custom={index}
                        whileHover="hover"
                        whileTap="tap"
                        variants={cardHover}
                      >
                        <ProjectCard project={project} />
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      <Footer />
    </div>
  );
};