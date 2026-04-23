// src/admin1/pages/CommitteeApplications.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminCommitteeAPI } from '../../lib/api';
import { CheckCircle2, XCircle, Loader2, Users } from 'lucide-react';

interface CommitteeApplication {
  id: number;
  user: {
    id: number;
    full_name: string;
    email: string;
    matric_number: string;
  };
  committee: {
    id: number;
    name: string;
  };
  phone_number: string;
  reason: string;
  offer: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_note: string;
  created_at: string;
}

const AdminCommitteeApplications: React.FC = () => {
  const qc = useQueryClient();
  const [note, setNote] = useState<Record<number, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['admin-committee-applications'],
    queryFn: async () => {
      const res = await adminCommitteeAPI.getApplications();
      // Now the API is typed correctly with PaginatedResponse
      return res.data.results;
    },
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, admin_note }: { id: number; admin_note?: string }) =>
      adminCommitteeAPI.approve(id, admin_note),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-committee-applications'] }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, admin_note }: { id: number; admin_note?: string }) =>
      adminCommitteeAPI.reject(id, admin_note),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-committee-applications'] }),
  });

  const applications = data || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0f1e] p-6 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-green-100 dark:bg-green-500/10 rounded-lg">
            <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Committee Applications</h1>
        </div>

        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-green-600" />
          </div>
        )}

        {!isLoading && applications.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-[#161d2e] border border-gray-100 dark:border-white/[0.07] rounded-2xl">
            <p className="text-gray-500 dark:text-slate-400">No applications received yet.</p>
          </div>
        )}

        <div className="space-y-4">
          {applications.map((app) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-[#161d2e] border border-gray-100 dark:border-white/[0.07] rounded-2xl p-5 sm:p-6"
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">{app.user.full_name}</h3>
                    <span className="text-xs text-gray-500 dark:text-slate-400">· {app.user.matric_number}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      app.status === 'pending'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
                        : app.status === 'approved'
                        ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-300'
                        : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300'
                    }`}>
                      {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">
                    <span className="font-medium">Committee:</span> {app.committee.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">
                    <span className="font-medium">Phone:</span> {app.phone_number}
                  </p>
                  <div className="mt-3 space-y-2">
                    <div>
                      <span className="text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wider">Reason</span>
                      <p className="text-sm text-gray-600 dark:text-slate-400 mt-0.5">{app.reason}</p>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wider">What They Offer</span>
                      <p className="text-sm text-gray-600 dark:text-slate-400 mt-0.5">{app.offer}</p>
                    </div>
                  </div>
                </div>

                {app.status === 'pending' && (
                  <div className="w-full lg:w-72 flex flex-col gap-2">
                    <textarea
                      placeholder="Admin note (optional)"
                      value={note[app.id] || ''}
                      onChange={(e) => setNote(prev => ({ ...prev, [app.id]: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/[0.07] bg-gray-50 dark:bg-white/[0.04] text-sm text-gray-900 dark:text-white placeholder:text-gray-400 resize-none"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => approveMutation.mutate({ id: app.id, admin_note: note[app.id] })}
                        disabled={approveMutation.isPending}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white rounded-xl text-sm font-medium transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Approve
                      </button>
                      <button
                        onClick={() => rejectMutation.mutate({ id: app.id, admin_note: note[app.id] })}
                        disabled={rejectMutation.isPending}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-xl text-sm font-medium transition-colors"
                      >
                        <XCircle className="w-4 h-4" /> Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminCommitteeApplications;