// src/admin1/pages/Complaints.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminComplaintAPI } from '../../lib/api';
import { Loader2, MessageSquareWarning, ShieldOff } from 'lucide-react';
import Navbar from '../components/Navbar';

interface AdminComplaint {
  id: number;
  user: { id: number; full_name: string; email: string; matric_number: string } | null;
  is_anonymous: boolean;
  subject: string;
  message: string;
  status: 'new' | 'in_progress' | 'resolved' | 'dismissed';
  admin_note: string;
  created_at: string;
}

const STATUS_OPTIONS: { value: AdminComplaint['status']; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'dismissed', label: 'Dismissed' },
];

const STATUS_STYLES: Record<string, string> = {
  new: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
  in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300',
  resolved: 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-300',
  dismissed: 'bg-gray-100 text-gray-500 dark:bg-white/[0.04] dark:text-slate-400',
};

const AdminComplaints: React.FC = () => {
  const qc = useQueryClient();
  const [note, setNote] = useState<Record<number, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['admin-complaints'],
    queryFn: async () => {
      const res = await adminComplaintAPI.getAll();
      return res.data.results as AdminComplaint[];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, admin_note }: { id: number; status: string; admin_note?: string }) =>
      adminComplaintAPI.updateStatus(id, status, admin_note),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-complaints'] }),
  });

  const complaints = data || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0f1e]">
      <Navbar />

      <div className="p-6 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-green-100 dark:bg-green-500/10 rounded-lg">
              <MessageSquareWarning className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Complaints</h1>
          </div>

          {isLoading && (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-green-600" />
            </div>
          )}

          {!isLoading && complaints.length === 0 && (
            <div className="text-center py-16 bg-white dark:bg-[#161d2e] border border-gray-100 dark:border-white/[0.07] rounded-2xl">
              <p className="text-gray-500 dark:text-slate-400">No complaints submitted yet.</p>
            </div>
          )}

          <div className="space-y-4">
            {complaints.map((c) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-[#161d2e] border border-gray-100 dark:border-white/[0.07] rounded-2xl p-5 sm:p-6"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="text-base font-bold text-gray-900 dark:text-white">{c.subject}</h3>
                      {c.is_anonymous ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-white/[0.04] dark:text-slate-400">
                          <ShieldOff className="w-3 h-3" /> Anonymous
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500 dark:text-slate-400">
                          · {c.user?.full_name} ({c.user?.email})
                        </span>
                      )}
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[c.status]}`}>
                        {STATUS_OPTIONS.find((s) => s.value === c.status)?.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-slate-400 mt-1 whitespace-pre-wrap">{c.message}</p>
                    {c.admin_note && (
                      <div className="mt-3">
                        <span className="text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wider">Admin Note</span>
                        <p className="text-sm text-gray-600 dark:text-slate-400 mt-0.5">{c.admin_note}</p>
                      </div>
                    )}
                  </div>

                  <div className="w-full lg:w-72 flex flex-col gap-2">
                    <textarea
                      placeholder="Admin note (optional)"
                      value={note[c.id] ?? c.admin_note}
                      onChange={(e) => setNote((prev) => ({ ...prev, [c.id]: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/[0.07] bg-gray-50 dark:bg-white/[0.04] text-sm text-gray-900 dark:text-white placeholder:text-gray-400 resize-none"
                      rows={2}
                    />
                    <select
                      value={c.status}
                      onChange={(e) =>
                        updateStatusMutation.mutate({
                          id: c.id, status: e.target.value, admin_note: note[c.id] ?? c.admin_note,
                        })
                      }
                      disabled={updateStatusMutation.isPending}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/[0.07] bg-white dark:bg-white/[0.04] text-sm text-gray-900 dark:text-white"
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminComplaints;
