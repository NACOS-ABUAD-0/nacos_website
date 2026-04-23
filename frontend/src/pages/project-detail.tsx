// src/pages/ProjectDetail.tsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useProject, useDeleteProject } from '../lib/hooks/useProjects';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useApplyCollaboration } from '../lib/hooks/useCollaboration';
import Navbar from '../components/Navbar';
import { Footer } from '../components/Footer';
import toast from 'react-hot-toast';
import {
  Heart, MessageCircle, Users, X, Send, Loader2,
  Code2, Palette, Brain, FileText, Wrench, Globe
} from 'lucide-react';

const SKILL_ICONS: Record<string, React.ReactNode> = {
  frontend: <Code2 className="w-4 h-4" />,
  backend: <Globe className="w-4 h-4" />,
  ui_ux: <Palette className="w-4 h-4" />,
  ai_ml: <Brain className="w-4 h-4" />,
  documentation: <FileText className="w-4 h-4" />,
  others: <Wrench className="w-4 h-4" />,
};

const SKILL_LABELS: Record<string, string> = {
  frontend: 'Frontend',
  backend: 'Backend',
  ui_ux: 'UI/UX',
  ai_ml: 'AI/ML',
  documentation: 'Documentation',
  others: 'Others',
};

export const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: project, isLoading, error } = useProject(id!);
  const deleteMutation = useDeleteProject();
  const { user, isAuthenticated } = useAuth();
  const { isDark } = useTheme();
  const { mutate: apply, isPending } = useApplyCollaboration();

  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedNeed, setSelectedNeed] = useState<number | null>(null);
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (project?.like_count !== undefined) {
      setLikeCount(project.like_count);
    }
  }, [project?.like_count]);

  const isOwner = user && project && user.id === project.owner?.id;
  const canEdit = isOwner || user?.is_staff;

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await deleteMutation.mutateAsync(id!);
        navigate('/projects');
      } catch (err) {
        console.error('Failed to delete project:', err);
      }
    }
  };

  const handleLike = () => {
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
    setIsLiked((prev) => !prev);
  };

const handleApply = (e: React.FormEvent) => {
  e.preventDefault();
  if (!phone.trim() || !message.trim()) {
    toast.error('Please fill in all fields');
    return;
  }

  // Build payload - only include need_id if it exists
  const payload: {
    phone_number: string;
    message: string;
    need_id?: number;
  } = {
    phone_number: phone,
    message: message,
  };

  if (selectedNeed) {
    payload.need_id = selectedNeed;
  }

  apply(
    {
      projectId: id!,
      ...payload,
    },
    {
      onSuccess: () => {
        toast.success('Application sent successfully!');
        setShowApplyModal(false);
        setPhone('');
        setMessage('');
        setSelectedNeed(null);
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.error || 'Failed to apply';
        toast.error(msg);
      },
    }
  );
};

  if (isLoading) {
    return (
      <div className={`min-h-screen flex flex-col ${isDark ? 'bg-[#0a0f1e]' : 'bg-white'}`}>
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className={`min-h-screen flex flex-col ${isDark ? 'bg-[#0a0f1e]' : 'bg-white'}`}>
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center px-4">
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Project not found
            </h1>
            <p className={`mt-2 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
              The project you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Link
              to="/projects"
              className="mt-4 inline-block bg-gradient-to-r from-green-600 to-teal-600 text-white px-4 py-2 rounded-lg hover:shadow-md transition-all"
            >
              Back to Projects
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const ownerName = project.owner?.full_name ?? 'Unknown';
  const ownerInitial = ownerName.charAt(0).toUpperCase();
  const openNeeds = project.collaboration_needs?.filter((n: any) => !n.is_filled) || [];

  return (
    <div className={`min-h-screen flex flex-col ${isDark ? 'bg-[#0a0f1e]' : 'bg-white'}`}>
      <Navbar />
      <main className="flex-grow">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Header Card */}
            <div className={`rounded-2xl border shadow-sm mb-8 overflow-hidden ${
              isDark ? 'bg-[#161d2e] border-white/[0.07]' : 'bg-white border-gray-100'
            }`}>
              <div className={`px-6 py-4 border-b ${
                isDark ? 'border-white/[0.07] bg-[#0f1525]' : 'border-gray-100 bg-gradient-to-r from-gray-50 to-white'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {project.title}
                        </h1>
                        {project.has_collaboration_needs && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full border border-blue-200">
                            <Users className="w-3 h-3" />
                            Needs Help
                          </span>
                        )}
                      </div>
                      <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                        by{' '}
                        <Link
                          to={`/profile/${project.owner?.id}`}
                          className="text-green-600 hover:text-green-700 font-medium"
                        >
                          {ownerName}
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

              {/* Stats bar */}
              <div className={`px-6 py-3 border-b ${
                isDark ? 'bg-[#0f1525] border-white/[0.07]' : 'bg-gray-50 border-gray-100'
              }`}>
                <div className="flex flex-wrap items-center gap-6 text-sm">
                  <button
                    onClick={handleLike}
                    className={`flex items-center gap-2 px-3 py-1 rounded-md border transition-colors ${
                      isLiked
                        ? 'bg-green-50 border-green-200 text-green-700'
                        : isDark
                          ? 'bg-white/[0.04] border-white/[0.07] text-slate-300 hover:bg-white/[0.06]'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <svg
                      className={`w-4 h-4 ${isLiked ? 'fill-current text-green-600' : 'text-gray-400'}`}
                      viewBox="0 0 16 16"
                    >
                      <path fillRule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314z" />
                    </svg>
                    <span className="font-medium">{likeCount}</span>
                  </button>

                  <div className={`flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Updated {new Date(project.updated_at).toLocaleDateString()}</span>
                  </div>

                  <div className={`flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* README area */}
              <div className="lg:col-span-3 space-y-8">
                {/* Collaboration Needs */}
                {openNeeds.length > 0 && (
                  <div className={`p-6 rounded-2xl border ${
                    isDark ? 'bg-[#161d2e] border-white/[0.07]' : 'bg-white border-gray-100'
                  }`}>
                    <h2 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Collaboration Needs
                    </h2>
                    <div className="space-y-3">
                      {openNeeds.map((need: any) => (
                        <div
                          key={need.id}
                          className={`flex items-center justify-between p-4 rounded-xl border ${
                            isDark ? 'bg-white/[0.03] border-white/[0.07]' : 'bg-gray-50 border-gray-100'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-100 text-blue-600'
                            }`}>
                              {SKILL_ICONS[need.skill_type] || <Wrench className="w-4 h-4" />}
                            </div>
                            <div>
                              <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {need.custom_skill || SKILL_LABELS[need.skill_type] || need.skill_type}
                              </p>
                              {need.description && (
                                <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                                  {need.description}
                                </p>
                              )}
                            </div>
                          </div>
                          {!isOwner && isAuthenticated && (
                            <button
                              onClick={() => {
                                setSelectedNeed(need.id);
                                setShowApplyModal(true);
                              }}
                              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                            >
                              Apply
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* README */}
                <div className={`rounded-2xl border shadow-sm overflow-hidden ${
                  isDark ? 'bg-[#161d2e] border-white/[0.07]' : 'bg-white border-gray-100'
                }`}>
                  <div className={`border-b ${
                    isDark ? 'border-white/[0.07]' : 'border-gray-100'
                  }`}>
                    <nav className="flex -mb-px">
                      <button className="border-b-2 border-green-500 text-green-600 px-4 py-3 text-sm font-medium">
                        README
                      </button>
                    </nav>
                  </div>
                  <div className="p-6">
                    <div className="prose max-w-none text-sm">
                      <div className={`border rounded-xl p-4 mb-6 ${
                        isDark ? 'bg-white/[0.02] border-white/[0.07]' : 'bg-gray-50 border-gray-200'
                      }`}>
                        <h2 className={`text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          About this project
                        </h2>
                        <p className={`whitespace-pre-line leading-relaxed ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                          {project.description}
                        </p>
                      </div>

                      {project.images && project.images.length > 0 && (
                        <div className="mb-6">
                          <h3 className={`text-md font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Screenshots & Demos
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {project.images.map((image: string, index: number) => (
                              <div
                                key={index}
                                className={`border rounded-xl overflow-hidden ${
                                  isDark ? 'border-white/[0.07]' : 'border-gray-200'
                                }`}
                              >
                                <img
                                  src={image}
                                  alt={`${project.title} – Image ${index + 1}`}
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

              {/* Sidebar */}
              <div className="lg:col-span-1 space-y-6">
                {/* Technologies */}
                {project.tags && project.tags.length > 0 && (
                  <div className={`rounded-2xl border shadow-sm p-5 ${
                    isDark ? 'bg-[#161d2e] border-white/[0.07]' : 'bg-white border-gray-100'
                  }`}>
                    <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                      Technologies
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {project.tags.map((tag: { id: number; name: string }) => (
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

                {/* Links */}
                {project.links && Object.keys(project.links).length > 0 && (
                  <div className={`rounded-2xl border shadow-sm p-5 ${
                    isDark ? 'bg-[#161d2e] border-white/[0.07]' : 'bg-white border-gray-100'
                  }`}>
                    <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.102m3.172-3.172l1.102-1.102a4 4 0 00-5.656-5.656l-4 4a4 4 0 105.656 5.656z" />
                      </svg>
                      Project Links
                    </h3>
                    <div className="space-y-2">
                      {Object.entries(project.links).map(([key, value]) => {
                        let hostname = value as string;
                        try { hostname = new URL(value as string).hostname; } catch { /* keep raw */ }
                        return (
                          <a
                            key={key}
                            href={value as string}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-2 p-2 text-sm rounded-md transition-colors group ${
                              isDark
                                ? 'text-slate-300 hover:bg-white/[0.04]'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <svg className={`w-4 h-4 ${isDark ? 'text-slate-500' : 'text-gray-400'} group-hover:text-green-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            <span className="capitalize font-medium">{key}</span>
                            <span className={`truncate flex-1 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{hostname}</span>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Owner */}
                <div className={`rounded-2xl border shadow-sm p-5 ${
                  isDark ? 'bg-[#161d2e] border-white/[0.07]' : 'bg-white border-gray-100'
                }`}>
                  <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Owner
                  </h3>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">{ownerInitial}</span>
                    </div>
                    <div>
                      <Link
                        to={`/profile/${project.owner?.id}`}
                        className={`text-sm font-medium hover:text-green-600 transition-colors ${
                          isDark ? 'text-white' : 'text-gray-900'
                        }`}
                      >
                        {ownerName}
                      </Link>
                      <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Project creator</p>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className={`rounded-2xl border shadow-sm p-5 ${
                  isDark ? 'bg-[#161d2e] border-white/[0.07]' : 'bg-white border-gray-100'
                }`}>
                  <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Details
                  </h3>
                  <div className={`space-y-2 text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                    <div className="flex justify-between">
                      <span>Created</span>
                      <span className="font-medium">
                        {new Date(project.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last updated</span>
                      <span className="font-medium">
                        {new Date(project.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Visibility</span>
                      <span className="font-medium text-green-600">Public</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Apply Modal */}
      <AnimatePresence>
        {showApplyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowApplyModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-md p-6 rounded-2xl border ${
                isDark ? 'bg-[#161d2e] border-white/[0.07]' : 'bg-white border-gray-100'
              }`}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Apply to Collaborate
                </h3>
                <button
                  onClick={() => setShowApplyModal(false)}
                  className={`p-1 rounded-lg ${
                    isDark ? 'hover:bg-white/[0.05]' : 'hover:bg-gray-100'
                  }`}
                >
                  <X className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-gray-500'}`} />
                </button>
              </div>

              <form onSubmit={handleApply} className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    isDark ? 'text-slate-300' : 'text-gray-700'
                  }`}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="08012345678"
                    className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:ring-2 focus:ring-green-500 outline-none ${
                      isDark
                        ? 'bg-white/[0.04] border-white/[0.07] text-white placeholder:text-slate-600'
                        : 'bg-white border-gray-200 text-gray-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    isDark ? 'text-slate-300' : 'text-gray-700'
                  }`}>
                    Why do you want to help?
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell the project owner why you're a good fit..."
                    className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:ring-2 focus:ring-green-500 outline-none resize-none ${
                      isDark
                        ? 'bg-white/[0.04] border-white/[0.07] text-white placeholder:text-slate-600'
                        : 'bg-white border-gray-200 text-gray-900'
                    }`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Submit Application
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
};