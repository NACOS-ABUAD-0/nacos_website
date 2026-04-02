import React from 'react';
import { Link } from 'react-router-dom';
import type { Project } from '../types';
import { useLikeProject, useUnlikeProject } from '../lib/hooks/useProjects';

interface ProjectCardProps {
  project: Project;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const likeMutation = useLikeProject();
  const unlikeMutation = useUnlikeProject();

  const isLiked = project.is_liked_by_user ?? false;
  const likeCount = project.like_count ?? 0;

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isLiked) {
      unlikeMutation.mutate(project.id);
    } else {
      likeMutation.mutate(project.id);
    }
  };

  const ownerName = project.owner?.full_name ?? 'Unknown';
  const ownerInitial = ownerName.charAt(0).toUpperCase();

  const isLoading = likeMutation.isPending || unlikeMutation.isPending;

  return (
    <Link
      to={`/projects/${project.id}`}
      className="group block bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-green-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
    >
      {project.images && project.images.length > 0 ? (
        <div className="relative h-48 overflow-hidden bg-gray-100">
          <img
            src={project.images[0]}
            alt={project.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {project.is_featured && (
            <div className="absolute top-3 right-3">
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full border border-yellow-200">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                Featured
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="h-48 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
          <div className="text-gray-400 text-center">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            <div className="text-sm font-medium">No Image</div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0" />
          <h3 className="text-sm font-semibold text-gray-900 truncate group-hover:text-green-600 transition-colors">
            {project.title}
          </h3>
        </div>
      </div>

      <div className="p-4">
        <p className="text-gray-600 text-sm leading-relaxed line-clamp-2 mb-4">
          {project.description}
        </p>

        {project.tags && project.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {project.tags.slice(0, 3).map((tag) => (
              <span key={tag.id} className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-md border border-blue-200">
                {tag.name}
              </span>
            ))}
            {project.tags.length > 3 && (
              <span className="inline-flex items-center px-2 py-1 bg-gray-50 text-gray-500 text-xs font-medium rounded-md border border-gray-200">
                +{project.tags.length - 3}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="w-5 h-5 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">{ownerInitial}</span>
              </div>
              <span className="font-medium">{ownerName}</span>
            </div>

            <button
              onClick={handleLike}
              disabled={isLoading}
              className={`flex items-center gap-1 px-2 py-1 rounded-md border transition-all duration-200 ${
                isLiked ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <svg className={`w-3 h-3 ${isLiked ? 'text-green-600 fill-current' : 'text-gray-400'}`} viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314z" />
              </svg>
              <span className="font-medium">{likeCount}</span>
            </button>
          </div>

          <time dateTime={project.created_at} className="text-xs text-gray-400">
            {new Date(project.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </time>
        </div>
      </div>

      {project.tags && project.tags.length > 0 && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-xs text-gray-600 font-medium">{project.tags[0].name}</span>
          </div>
        </div>
      )}
    </Link>
  );
};