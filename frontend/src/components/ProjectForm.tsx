// src/components/ProjectForm.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useSkills, useCreateProject, useUpdateProject } from '../lib/hooks/useProjects';
import { cloudinaryAPI } from '../lib/api';
import type { Project, Skill, CollaborationNeed } from '../types';

// ─── Relaxed Zod Schema ──────────────────────────────────────────────────────
// We avoid strict .url() validation on links/images to prevent silent failures
// when users paste plain domains. tag_ids accepts both strings and numbers.
// ─────────────────────────────────────────────────────────────────────────────
const projectSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().min(1, 'Description is required'),
  tag_ids: z.array(z.union([z.string(), z.number()])).optional().default([]),
  links: z.record(z.string().min(1)).optional().default({}),
  images: z.array(z.string().min(1)).optional().default([]),
  collaboration_needs: z.array(
    z.object({
      skill_type: z.enum(['frontend', 'backend', 'ui_ux', 'ai_ml', 'documentation', 'others']),
      custom_skill: z.string().optional(),
      description: z.string().optional(),
    })
  ).optional().default([]),
});

type ProjectFormData = z.infer<<typeof projectSchema>;

interface CollaborationNeedForm {
  skill_type: 'frontend' | 'backend' | 'ui_ux' | 'ai_ml' | 'documentation' | 'others';
  custom_skill: string;
  description: string;
}

const SKILL_OPTIONS = [
  { value: 'frontend', label: 'Frontend' },
  { value: 'backend', label: 'Backend' },
  { value: 'ui_ux', label: 'UI/UX' },
  { value: 'ai_ml', label: 'AI/ML' },
  { value: 'documentation', label: 'Documentation' },
  { value: 'others', label: 'Others' },
];

interface ProjectFormProps {
  project?: Project;
  onSubmit?: () => void;
  onCancel?: () => void;
}

export const ProjectForm: React.FC<<ProjectFormProps> = ({
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
    reset,
  } = useForm<<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: '',
      description: '',
      tag_ids: [],
      links: {},
      images: [],
      collaboration_needs: [],
    },
  });

  const [linkInputs, setLinkInputs] = useState<{ key: string; value: string }[]>([]);
  const [imageInputs, setImageInputs] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [collabNeeds, setCollabNeeds] = useState<<CollaborationNeedForm[]>([]);
  const fileInputRef = useRef<<HTMLInputElement>(null);

  // ─── Sync form + local state whenever the project changes ─────────────────
  useEffect(() => {
    if (project) {
      reset({
        title: project.title || '',
        description: project.description || '',
        tag_ids: project.tags?.map((tag: Skill) => tag.id) || [],
        links: project.links || {},
        images: project.images || [],
        collaboration_needs:
          project.collaboration_needs?.map((need: CollaborationNeed) => ({
            skill_type: need.skill_type,
            custom_skill: need.custom_skill || '',
            description: need.description || '',
          })) || [],
      });
      setLinkInputs(
        Object.entries(project.links || {}).map(([key, value]) => ({ key, value }))
      );
      setImageInputs(project.images || []);
      setCollabNeeds(
        project.collaboration_needs?.map((need: CollaborationNeed) => ({
          skill_type: need.skill_type,
          custom_skill: need.custom_skill || '',
          description: need.description || '',
        })) || []
      );
    } else {
      reset({
        title: '',
        description: '',
        tag_ids: [],
        links: {},
        images: [],
        collaboration_needs: [],
      });
      setLinkInputs([]);
      setImageInputs([]);
      setCollabNeeds([]);
    }
  }, [project?.id, reset]);

  const selectedTags = watch('tag_ids') || [];

  // ─── Image Upload ──────────────────────────────────────────────────────────
  const handleImageUpload = async (e: React.ChangeEvent<<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploadingImages(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of Array.from(files)) {
        const result = await cloudinaryAPI.upload(file);
        uploadedUrls.push(result.secure_url);
      }
      const newImages = [...imageInputs, ...uploadedUrls];
      setImageInputs(newImages);
      setValue('images', newImages, { shouldValidate: true });
    } catch (err) {
      alert('Failed to upload images. Please try again.');
    } finally {
      setUploadingImages(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImageInput = (index: number) => {
    const updated = imageInputs.filter((_, i) => i !== index);
    setImageInputs(updated);
    setValue('images', updated, { shouldValidate: true });
  };

  // ─── Collaboration Needs ───────────────────────────────────────────────────
  const addCollabNeed = () => {
    const updated = [
      ...collabNeeds,
      { skill_type: 'frontend' as const, custom_skill: '', description: '' },
    ];
    setCollabNeeds(updated);
    setValue('collaboration_needs', updated, { shouldValidate: true });
  };

  const removeCollabNeed = (index: number) => {
    const updated = collabNeeds.filter((_, i) => i !== index);
    setCollabNeeds(updated);
    setValue('collaboration_needs', updated, { shouldValidate: true });
  };

  const updateCollabNeed = (
    index: number,
    field: keyof CollaborationNeedForm,
    value: string
  ) => {
    const updated = [...collabNeeds];
    updated[index] = { ...updated[index], [field]: value };
    setCollabNeeds(updated);
    setValue('collaboration_needs', updated, { shouldValidate: true });
  };

  // ─── Links ─────────────────────────────────────────────────────────────────
  const addLinkInput = () => {
    const updated = [...linkInputs, { key: '', value: '' }];
    setLinkInputs(updated);
    syncLinksToForm(updated);
  };

  const removeLinkInput = (index: number) => {
    const updated = linkInputs.filter((_, i) => i !== index);
    setLinkInputs(updated);
    syncLinksToForm(updated);
  };

  const updateLinkInput = (
    index: number,
    field: 'key' | 'value',
    newValue: string
  ) => {
    const updated = [...linkInputs];
    updated[index][field] = newValue;
    setLinkInputs(updated);
    syncLinksToForm(updated);
  };

  const syncLinksToForm = (inputs: typeof linkInputs) => {
    const record = inputs.reduce<<Record<string, string>>((acc, { key, value }) => {
      if (key.trim() && value.trim()) acc[key.trim()] = value.trim();
      return acc;
    }, {});
    setValue('links', record, { shouldValidate: true });
  };

  // ─── Tags ──────────────────────────────────────────────────────────────────
  const toggleTag = (tagId: number | string) => {
    const current = selectedTags;
    const newTags = current.includes(tagId)
      ? current.filter((id) => id !== tagId)
      : [...current, tagId];
    setValue('tag_ids', newTags, { shouldValidate: true });
  };

  // ─── Submit ──────────────────────────────────────────────────────────────
  const handleFormSubmit = (data: ProjectFormData) => {
    if (project && !project.id) {
      console.error('Update failed: project.id is missing');
      return;
    }

    // Build a clean payload — do NOT spread ...data to avoid sending
    // both collaboration_needs (from schema) and collaboration_needs_data
    const formattedData = {
      title: data.title,
      description: data.description,
      tag_ids: data.tag_ids,
      links: linkInputs.reduce<<Record<string, string>>((acc, { key, value }) => {
        if (key.trim() && value.trim()) acc[key.trim()] = value.trim();
        return acc;
      }, {}),
      images: imageInputs.filter((url: string) => url.trim() !== ''),
      collaboration_needs_data: collabNeeds.map((need) => ({
        skill_type: need.skill_type,
        custom_skill: need.skill_type === 'others' ? need.custom_skill : '',
        description: need.description,
      })),
    };

    if (project?.id) {
      updateMutation.mutate(
        { id: project.id, data: formattedData },
        {
          onSuccess: () => onSubmit?.(),
          onError: (err) => console.error('Update mutation error:', err),
        }
      );
    } else {
      createMutation.mutate(formattedData, {
        onSuccess: () => onSubmit?.(),
        onError: (err) => console.error('Create mutation error:', err),
      });
    }
  };

  const isLoading =
    createMutation.isPending || updateMutation.isPending || uploadingImages;

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
          {project
            ? 'Update your project details'
            : 'Build something amazing with the community'}
        </p>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-8">
        {/* Global Mutation Error */}
        {(updateMutation.isError || createMutation.isError) && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-600 font-medium">
              {(updateMutation.error as Error)?.message ||
                (createMutation.error as Error)?.message ||
                'Something went wrong. Please try again.'}
            </p>
          </div>
        )}

        {/* Title Field */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="title"
              className="block text-sm font-semibold text-gray-900"
            >
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
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {errors.title.message}
            </p>
          )}
        </div>

        {/* Description Field */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="description"
              className="block text-sm font-semibold text-gray-900"
            >
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
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {errors.description.message}
            </p>
          )}
        </div>

        {/* Skills/Tags */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-semibold text-gray-900">
              Technologies & Skills
            </label>
            <span className="text-xs text-gray-500">Optional</span>
          </div>
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
                  <svg
                    className="w-3 h-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            ))}
            {skills?.length === 0 && (
              <p className="text-gray-500 text-sm">No skills available</p>
            )}
          </div>
          {errors.tag_ids && (
            <p className="text-sm text-red-600 font-medium">
              {errors.tag_ids.message || 'Invalid tag selection'}
            </p>
          )}
        </div>

        {/* Collaboration Needs */}
        <div className="space-y-4 border-t border-gray-200 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Collaboration Needs
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Specify what help you need from the community
              </p>
            </div>
            <span className="text-xs text-gray-500">Optional</span>
          </div>

          {errors.collaboration_needs && (
            <p className="text-sm text-red-600 font-medium">
              {errors.collaboration_needs.message || 'Invalid collaboration needs'}
            </p>
          )}

          {collabNeeds.map((need, index) => (
            <div
              key={index}
              className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Need #{index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeCollabNeed(index)}
                  className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Skill Type
                </label>
                <select
                  value={need.skill_type}
                  onChange={(e) =>
                    updateCollabNeed(index, 'skill_type', e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-200 bg-white"
                >
                  {SKILL_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {need.skill_type === 'others' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Custom Skill
                  </label>
                  <input
                    type="text"
                    value={need.custom_skill}
                    onChange={(e) =>
                      updateCollabNeed(index, 'custom_skill', e.target.value)
                    }
                    placeholder="e.g. DevOps, Mobile Development"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-200"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={need.description}
                  onChange={(e) =>
                    updateCollabNeed(index, 'description', e.target.value)
                  }
                  rows={2}
                  placeholder="e.g. Need a React dev to build dashboard UI"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-200 resize-none"
                />
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addCollabNeed}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-all duration-200"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Collaboration Need
          </button>
        </div>

        {/* Links Section */}
        <div className="space-y-4 border-t border-gray-200 pt-6">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-semibold text-gray-900">
              Project Links
            </label>
            <span className="text-xs text-gray-500">GitHub, Demo, etc.</span>
          </div>

          {errors.links && (
            <p className="text-sm text-red-600 font-medium">
              {errors.links.message || 'Invalid link entry'}
            </p>
          )}

          <div className="space-y-3">
            {linkInputs.map((link, index) => (
              <div key={index} className="flex gap-3 items-start">
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Platform (github, demo, website)"
                    value={link.key}
                    onChange={(e) =>
                      updateLinkInput(index, 'key', e.target.value)
                    }
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200"
                  />
                  <input
                    type="text"
                    placeholder="https://..."
                    value={link.value}
                    onChange={(e) =>
                      updateLinkInput(index, 'value', e.target.value)
                    }
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeLinkInput(index)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-200"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addLinkInput}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-all duration-200"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Link
            </button>
          </div>
        </div>

        {/* Cloudinary Image Upload */}
        <div className="space-y-4 border-t border-gray-200 pt-6">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-semibold text-gray-900">
              Project Images
            </label>
            <span className="text-xs text-gray-500">Upload screenshots</span>
          </div>

          {errors.images && (
            <p className="text-sm text-red-600 font-medium">
              {errors.images.message || 'Invalid image URL'}
            </p>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingImages}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-all duration-200 disabled:opacity-50"
          >
            {uploadingImages ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Upload Images
              </>
            )}
          </button>

          {imageInputs.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {imageInputs.map((url, index) => (
                <div key={index} className="relative group">
                  <img
                    src={url}
                    alt={`Project image ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => removeImageInput(index)}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
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