// frontend/src/pages/ProjectsGallery.tsx
import React, { useState } from 'react';
import { useProjects, useSkills } from '../lib/hooks/useProjects';
import { ProjectCard } from '../components/ProjectCard';
import Navbar from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Enhanced header section */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Project Showcase</h1>
              <p className="text-lg text-gray-600">
                Discover innovative projects built by ABUAD computing students
              </p>
            </div>
            {isAuthenticated && (
              <Link
                to="/projects/new"
                className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors duration-200 shadow-sm hover:shadow-md"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Project
              </Link>
            )}
          </div>

          {/* GitHub-inspired filters section */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <h2 className="text-lg font-semibold text-gray-900">Filter Projects</h2>
            </div>

            <form onSubmit={handleSearch} className="space-y-6">
              {/* Search input - GitHub style */}
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
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Skills filter - GitHub topics style */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Technologies & Skills
                </label>
                <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg border border-gray-200 min-h-16">
                  {skills?.map((skill) => (
                    <button
                      key={skill.id}
                      type="button"
                      onClick={() => handleTagToggle(skill.id)}
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${
                        selectedTags.includes(skill.id)
                          ? 'bg-green-500 text-white border-green-500 shadow-sm transform scale-105'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-green-300 hover:bg-green-50'
                      }`}
                    >
                      <span>{skill.name}</span>
                      {selectedTags.includes(skill.id) && (
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
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
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    Clear filters
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors duration-200 shadow-sm hover:shadow-md"
                  >
                    Apply filters
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Results section */}
          {isLoading && (
            <div className="flex justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading projects...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-lg">
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
            </div>
          )}

          {projects && (
            <>
              {/* Results header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {projects.count}
                    <span className="text-gray-600 font-normal"> project{projects.count !== 1 ? 's' : ''} found</span>
                  </h3>
                  {filters.search && (
                    <p className="text-sm text-gray-500 mt-1">
                      Matching "{filters.search}"
                    </p>
                  )}
                </div>

                {/* Sort options - GitHub style */}
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
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                  <div className="w-24 h-24 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
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
                    <Link
                      to="/projects/new"
                      className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors duration-200"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Create first project
                    </Link>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects.results?.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};
