import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useSkills, useCreateProject, useUpdateProject } from '../lib/hooks/useProjects';
import type { Project, Skill } from '../types';

const projectSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().min(1, 'Description is required'),
  tag_ids: z.array(z.number()).optional(),
  links: z.record(z.string().url('Invalid URL')).optional(),
  images: z.array(z.string().url('Invalid URL')).optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface ProjectFormProps {
  project?: Project;
  onSubmit?: () => void;
  onCancel?: () => void;
}

export const ProjectForm: React.FC<ProjectFormProps> = ({
  project,
  onSubmit,
  onCancel,
}) => {
  const { data: skills } = useSkills();
  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: project?.title || '',
      description: project?.description || '',
      tag_ids: project?.tags?.map((tag: Skill) => tag.id) || [],
      links: project?.links || {},
      images: project?.images || [],
    },
  });

  const [linkInputs, setLinkInputs] = useState<{ key: string; value: string }[]>([]);
  const [imageInputs, setImageInputs] = useState<string[]>([]);

  useEffect(() => {
    if (project?.links) {
      setLinkInputs(
        Object.entries(project.links).map(([key, value]) => ({ key, value }))
      );
    }
    if (project?.images) {
      setImageInputs(project.images);
    }
  }, [project]);

  const selectedTags = watch('tag_ids') || [];

  const handleFormSubmit = (data: ProjectFormData) => {
    const formattedData = {
      ...data,
      links: linkInputs.reduce<Record<string, string>>((acc, { key, value }) => {
        if (key && value) acc[key] = value;
        return acc;
      }, {}),
      images: imageInputs.filter((url: string) => url.trim() !== ''),
    };

    if (project) {
      updateMutation.mutate(
        { id: project.id, data: formattedData },
        { onSuccess: onSubmit }
      );
    } else {
      createMutation.mutate(formattedData, { onSuccess: onSubmit });
    }
  };

  const addLinkInput = () => setLinkInputs([...linkInputs, { key: '', value: '' }]);

  const removeLinkInput = (index: number) =>
    setLinkInputs(linkInputs.filter((_, i) => i !== index));

  const updateLinkInput = (index: number, field: 'key' | 'value', newValue: string) => {
    const updated = [...linkInputs];
    updated[index][field] = newValue;
    setLinkInputs(updated);
  };

  const addImageInput = () => setImageInputs([...imageInputs, '']);

  const removeImageInput = (index: number) =>
    setImageInputs(imageInputs.filter((_, i) => i !== index));

  const updateImageInput = (index: number, newValue: string) => {
    const updated = [...imageInputs];
    updated[index] = newValue;
    setImageInputs(updated);
  };

  const toggleTag = (tagId: number) => {
    const newTags = selectedTags.includes(tagId)
      ? selectedTags.filter((id: number) => id !== tagId)
      : [...selectedTags, tagId];
    setValue('tag_ids', newTags);
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-green-500 rounded-full" />
          <h2 className="text-xl font-semibold text-gray-900">
            {project ? 'Edit Project' : 'Create New Project'}
          </h2>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          {project ? 'Update your project details' : 'Build something amazing with the community'}
        </p>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-8">
        {/* Title Field */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="title" className="block text-sm font-semibold text-gray-900">
              Project Title
            </label>
            <span className="text-xs text-gray-500">Required</span>
          </div>
          <input
            {...register('title')}
            type="text"
            className="block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm placeholder-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200 bg-white"
            placeholder="Enter project title..."
          />
          {errors.title && (
            <p className="text-sm text-red-600 font-medium flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.title.message}
            </p>
          )}
        </div>

        {/* Description Field */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="description" className="block text-sm font-semibold text-gray-900">
              Description
            </label>
            <span className="text-xs text-gray-500">Required</span>
          </div>
          <textarea
            {...register('description')}
            rows={5}
            className="block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm placeholder-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200 bg-white font-mono"
            placeholder="Describe your project, technologies used, challenges overcome..."
          />
          {errors.description && (
            <p className="text-sm text-red-600 font-medium flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.description.message}
            </p>
          )}
        </div>

        {/* Skills/Tags */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-900">
            Technologies & Skills
          </label>
          <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-xl border border-gray-200 min-h-16">
            {skills?.map((skill: Skill) => (
              <button
                key={skill.id}
                type="button"
                onClick={() => toggleTag(skill.id)}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${
                  selectedTags.includes(skill.id)
                    ? 'bg-green-500 text-white border-green-500 shadow-sm scale-105'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-green-300 hover:bg-green-50'
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

        {/* Links Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-semibold text-gray-900">Project Links</label>
            <span className="text-xs text-gray-500">GitHub, Demo, etc.</span>
          </div>

          <div className="space-y-3">
            {linkInputs.map((link, index) => (
              <div key={index} className="flex gap-3 items-start">
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Platform (github, demo, website)"
                    value={link.key}
                    onChange={(e) => updateLinkInput(index, 'key', e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200"
                  />
                  <input
                    type="url"
                    placeholder="https://..."
                    value={link.value}
                    onChange={(e) => updateLinkInput(index, 'value', e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeLinkInput(index)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addLinkInput}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Link
            </button>
          </div>
        </div>

        {/* Images Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-semibold text-gray-900">Image URLs</label>
            <span className="text-xs text-gray-500">Screenshots, mockups</span>
          </div>

          <div className="space-y-3">
            {imageInputs.map((url: string, index: number) => (
              <div key={index} className="flex gap-3">
                <input
                  type="url"
                  placeholder="https://example.com/image.png"
                  value={url}
                  onChange={(e) => updateImageInput(index, e.target.value)}
                  className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => removeImageInput(index)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addImageInput}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Image URL
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200 hover:shadow-sm"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-teal-600 rounded-lg hover:shadow-md hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : project ? (
              'Update Project'
            ) : (
              'Create Project'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};