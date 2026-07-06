// src/admin1/pages/Resources.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminResourceAPI, resourcesAPI, cloudinaryAPI } from '../../lib/api';
import { Loader2, FileText, Upload, X, Trash2 } from 'lucide-react';
import Navbar from '../components/Navbar';

interface AdminResource {
  id: number;
  title: string;
  description: string;
  url: string;
  course_code: string;
  year: string;
  category: { id: number; name: string } | null;
  tags: Array<{ id: number; name: string }>;
  file_type: string;
  file_size: number | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_note: string;
  submitted_by: { id: number; full_name: string } | null;
  created_at: string;
}

interface ResourceCategory {
  id: number;
  name: string;
}

const STATUS_TABS: { value: 'all' | AdminResource['status']; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
  approved: 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300',
};

const ALLOWED_FILE_TYPES = '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.txt';

const AdminResources: React.FC = () => {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'all' | AdminResource['status']>('pending');
  const [note, setNote] = useState<Record<number, string>>({});
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-resources', tab],
    queryFn: async () => {
      const res = await adminResourceAPI.getAll(tab === 'all' ? {} : { status: tab });
      return res.data.results as AdminResource[];
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => adminResourceAPI.approve(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-resources'] }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, admin_note }: { id: number; admin_note?: string }) =>
      adminResourceAPI.reject(id, admin_note),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-resources'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminResourceAPI.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-resources'] }),
  });

  const resources = data || [];

  // ─── Create (admin-authored) resource form ────────────────────────────────
  const [categories, setCategories] = useState<ResourceCategory[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [year, setYear] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const openCreateForm = () => {
    setCreateError(null);
    setShowCreateForm(true);
    if (categories.length === 0) {
      resourcesAPI.getResourceCategories().then((res) => setCategories(res.data)).catch(() => {});
    }
  };

  const resetCreateForm = () => {
    setTitle('');
    setDescription('');
    setCourseCode('');
    setYear('');
    setCategoryId('');
    setFile(null);
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('Please choose a file to upload.');
      setIsUploading(true);
      const uploadResult = await cloudinaryAPI.uploadResourceFile(file);
      setIsUploading(false);
      return adminResourceAPI.create({
        title,
        description,
        course_code: courseCode,
        year,
        category_id: categoryId || undefined,
        url: uploadResult.secure_url,
        file_type: file.type || 'application/octet-stream',
        file_size: file.size,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-resources'] });
      resetCreateForm();
      setShowCreateForm(false);
    },
    onError: (err: any) => {
      setIsUploading(false);
      setCreateError(err?.message || 'Failed to create resource.');
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0f1e]">
      <Navbar />

      <div className="p-6 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-500/10 rounded-lg">
                <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Resources</h1>
            </div>
            <button
              onClick={openCreateForm}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700"
            >
              <Upload className="w-4 h-4" />
              Add Resource
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {STATUS_TABS.map((t) => (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                  tab === t.value
                    ? 'bg-green-600 text-white'
                    : 'bg-white dark:bg-white/[0.04] text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-white/[0.07]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {isLoading && (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-green-600" />
            </div>
          )}

          {!isLoading && resources.length === 0 && (
            <div className="text-center py-16 bg-white dark:bg-[#161d2e] border border-gray-100 dark:border-white/[0.07] rounded-2xl">
              <p className="text-gray-500 dark:text-slate-400">No resources here yet.</p>
            </div>
          )}

          <div className="space-y-4">
            {resources.map((r) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-[#161d2e] border border-gray-100 dark:border-white/[0.07] rounded-2xl p-5 sm:p-6"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="text-base font-bold text-gray-900 dark:text-white break-words">{r.title}</h3>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[r.status]}`}>
                        {r.status}
                      </span>
                      {r.submitted_by && (
                        <span className="text-xs text-gray-500 dark:text-slate-400">
                          · submitted by {r.submitted_by.full_name}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-slate-400 whitespace-pre-wrap break-words">
                      {r.description}
                    </p>
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500 dark:text-slate-400">
                      {r.course_code && <span>{r.course_code}</span>}
                      {r.year && <span>Year {r.year}</span>}
                      {r.category && <span>{r.category.name}</span>}
                      <a href={r.url} target="_blank" rel="noreferrer" className="text-green-600 hover:underline">
                        View file
                      </a>
                    </div>
                    {r.admin_note && (
                      <div className="mt-3">
                        <span className="text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                          Admin Note
                        </span>
                        <p className="text-sm text-gray-600 dark:text-slate-400 mt-0.5">{r.admin_note}</p>
                      </div>
                    )}
                  </div>

                  <div className="w-full lg:w-72 flex flex-col gap-2">
                    <textarea
                      placeholder="Admin note (optional)"
                      value={note[r.id] ?? r.admin_note}
                      onChange={(e) => setNote((prev) => ({ ...prev, [r.id]: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/[0.07] bg-gray-50 dark:bg-white/[0.04] text-sm text-gray-900 dark:text-white placeholder:text-gray-400 resize-none"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => approveMutation.mutate(r.id)}
                        disabled={r.status === 'approved' || approveMutation.isPending}
                        className="flex-1 px-3 py-2 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => rejectMutation.mutate({ id: r.id, admin_note: note[r.id] ?? r.admin_note })}
                        disabled={r.status === 'rejected' || rejectMutation.isPending}
                        className="flex-1 px-3 py-2 rounded-xl bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-300 text-sm font-medium hover:bg-red-200 disabled:opacity-50"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Delete this resource permanently?')) deleteMutation.mutate(r.id);
                        }}
                        className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-white/[0.04] text-gray-500 dark:text-slate-400 hover:bg-gray-200"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-[#161d2e] rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add Resource</h2>
              <button onClick={() => setShowCreateForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-white/[0.07] bg-gray-50 dark:bg-white/[0.04] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-white/[0.07] bg-gray-50 dark:bg-white/[0.04] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Course Code</label>
                  <input
                    type="text"
                    placeholder="e.g. CSC301"
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-white/[0.07] bg-gray-50 dark:bg-white/[0.04] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Year</label>
                  <input
                    type="text"
                    placeholder="e.g. 2025"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-white/[0.07] bg-gray-50 dark:bg-white/[0.04] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-600"
                  />
                </div>
              </div>

              {categories.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Category</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-white/[0.07] bg-gray-50 dark:bg-white/[0.04] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-600"
                  >
                    <option value="">None</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  File (PDF, Word, PowerPoint, Excel, ZIP, or text)
                </label>
                <input
                  type="file"
                  required
                  accept={ALLOWED_FILE_TYPES}
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="w-full text-sm text-gray-700 dark:text-slate-300"
                />
              </div>

              {createError && <p className="text-sm text-red-600">{createError}</p>}

              <button
                type="submit"
                disabled={isUploading || createMutation.isPending}
                className="w-full py-3 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-60"
              >
                {isUploading ? 'Uploading file...' : createMutation.isPending ? 'Saving...' : 'Add Resource'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminResources;
