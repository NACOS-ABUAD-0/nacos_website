// frontend/src/pages/project-detail.tsx
import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useProject, useDeleteProject } from '../lib/hooks/useProjects';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useAuth } from '../context/AuthContext';

export const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: project, isLoading, error } = useProject(id!);
  const deleteMutation = useDeleteProject();
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(project?.like_count || 0);

  const isOwner = user && project && user.id === project.owner.id;
  const canEdit = isOwner || user?.is_staff;

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await deleteMutation.mutateAsync(id!);
        navigate('/projects');
      } catch (error) {
        console.error('Failed to delete project:', error);
      }
    }
  };

  const handleLike = () => {
    if (isLiked) {
      setLikeCount(prev => prev - 1);
    } else {
      setLikeCount(prev => prev + 1);
    }
    setIsLiked(!isLiked);
    // TODO: Add actual like API call here
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Project not found</h1>
            <p className="text-gray-600 mt-2">
              The project you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Link
              to="/projects"
              className="mt-4 inline-block bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
            >
              Back to Projects
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-grow">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* GitHub-like header */}
          <div className="bg-white rounded-xl border border-gray-200 mb-6 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <h1 className="text-2xl font-semibold text-gray-900">{project.title}</h1>
                    <p className="text-gray-600 text-sm mt-1">
                      by{' '}
                      <Link
                        to={`/profile/${project.owner.id}`}
                        className="text-green-600 hover:text-green-700 font-medium"
                      >
                        {project.owner.full_name}
                      </Link>
                    </p>
                  </div>
                </div>

                {canEdit && (
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/projects/${project.id}/edit`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </Link>
                    <button
                      onClick={handleDelete}
                      disabled={deleteMutation.isPending}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* GitHub-like stats bar */}
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-6 text-sm">
                {/* Like/Star button */}
                <button
                  onClick={handleLike}
                  className={`flex items-center gap-2 px-3 py-1 rounded-md border transition-colors ${
                    isLiked
                      ? 'bg-green-50 border-green-200 text-green-700'
                      : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <svg
                    className={`w-4 h-4 ${isLiked ? 'fill-current text-green-600' : 'text-gray-400'}`}
                    viewBox="0 0 16 16"
                  >
                    <path fillRule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314z"/>
                  </svg>
                  <span className="font-medium">{likeCount}</span>
                </button>

                {/* Updated date */}
                <div className="flex items-center gap-2 text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Updated {new Date(project.updated_at).toLocaleDateString()}</span>
                </div>

                {/* Created date */}
                <div className="flex items-center gap-2 text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main content - GitHub-like README area */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* GitHub-like tab navigation */}
                <div className="border-b border-gray-200">
                  <nav className="flex -mb-px">
                    <button className="border-b-2 border-green-500 text-green-600 px-4 py-3 text-sm font-medium">
                      README
                    </button>
                  </nav>
                </div>

                {/* Project description - GitHub README style */}
                <div className="p-6">
                  <div className="prose max-w-none font-mono text-sm">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                      <h2 className="text-lg font-semibold text-gray-900 mb-3">About this project</h2>
                      <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                        {project.description}
                      </p>
                    </div>

                    {/* Images gallery - GitHub-like */}
                    {project.images && project.images.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-md font-semibold text-gray-900 mb-3">Screenshots & Demos</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {project.images.map((image, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                              <img
                                src={image}
                                alt={`${project.title} - Image ${index + 1}`}
                                className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar - GitHub-like project info */}
            <div className="lg:col-span-1 space-y-4">
              {/* Tags - GitHub topics style */}
              {project.tags && project.tags.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Technologies</h3>
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200"
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Links - GitHub-like URLs */}
              {project.links && Object.keys(project.links).length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Project Links</h3>
                  <div className="space-y-2">
                    {Object.entries(project.links).map(([key, value]) => (
                      <a
                        key={key}
                        href={value}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors group"
                      >
                        <svg className="w-4 h-4 text-gray-400 group-hover:text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        <span className="capitalize font-medium">{key}</span>
                        <span className="text-gray-400 truncate flex-1">{new URL(value).hostname}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Owner info - GitHub contributor style */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Owner</h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">
                      {project.owner.full_name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <Link
                      to={`/profile/${project.owner.id}`}
                      className="text-sm font-medium text-gray-900 hover:text-green-600 transition-colors"
                    >
                      {project.owner.full_name}
                    </Link>
                    <p className="text-xs text-gray-500">Project creator</p>
                  </div>
                </div>
              </div>

              {/* GitHub-like metadata */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Details</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Created</span>
                    <span className="font-medium">{new Date(project.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last updated</span>
                    <span className="font-medium">{new Date(project.updated_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Visibility</span>
                    <span className="font-medium text-green-600">Public</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};