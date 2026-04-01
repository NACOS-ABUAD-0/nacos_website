import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ProjectForm } from '../components/ProjectForm';
import Navbar from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useProject } from '../lib/hooks/useProjects';

export const ProjectFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: project, isLoading } = useProject(id!);

  const isEditing = !!id;

  const handleSubmit = () => {
    navigate(isEditing ? `/projects/${id}` : '/projects');
  };

  const handleCancel = () => {
    navigate(isEditing ? `/projects/${id}` : '/projects');
  };

  if (isLoading && isEditing) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading project details...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-grow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                {isEditing ? 'Edit Project' : 'Create New Project'}
              </h1>
            </div>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              {isEditing
                ? 'Update your project details and showcase your latest improvements to the community'
                : 'Share your innovative work with the NACOS community and showcase your skills'
              }
            </p>
          </div>

          {/* Form Container */}
          <ProjectForm
            project={project}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />

          {/* Additional guidance for new projects */}
          {!isEditing && (
            <div className="mt-8 bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-blue-800">Project Showcase Tips</h3>
                  <div className="text-sm text-blue-700 mt-1 space-y-1">
                    <p>• Add clear descriptions and screenshots to showcase your work</p>
                    <p>• Include relevant technologies and skills used in your project</p>
                    <p>• Provide live demo links and GitHub repositories when available</p>
                    <p>• Your project will be visible to the entire NACOS community</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};