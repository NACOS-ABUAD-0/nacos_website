import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { projectsAPI } from '../lib/api';
import { ProjectCard } from '../components/ProjectCard';
import Navbar from '../components/Navbar';
import { Footer } from '../components/Footer';

const MyProjectsPage: React.FC = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['projects', 'mine'],
    queryFn: () => projectsAPI.getMyProjects().then(res => res.data),
  });

  const projects: any[] = Array.isArray(data) ? data : data?.results ?? [];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-12">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-gray-900">
                My Projects
              </h1>
              <p className="text-lg text-gray-500 mt-1">
                Projects you have created
              </p>
            </div>
            <Link
              to="/projects/new"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-teal-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Project
            </Link>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">Failed to load your projects.</p>
              <button
                onClick={() => refetch()}
                className="bg-gradient-to-r from-green-600 to-teal-600 text-white px-6 py-2 rounded-lg hover:shadow-md transition-all"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !error && projects.length === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <div className="w-24 h-24 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects yet</h3>
              <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                Showcase your work to the NACOS community by creating your first project.
              </p>
              <Link
                to="/projects/new"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-teal-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Your First Project
              </Link>
            </div>
          )}

          {/* Projects grid */}
          {!isLoading && !error && projects.length > 0 && (
            <>
              <p className="text-sm text-gray-500 mb-6">
                {projects.length} project{projects.length !== 1 ? 's' : ''}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project: any) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MyProjectsPage;