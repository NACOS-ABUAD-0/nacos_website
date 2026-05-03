// src/pages/CollaborationRequestsPage.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import { projectsAPI, collaborationAPI } from '../lib/api';
import {
  useAcceptCollaborationRequest,
  useRejectCollaborationRequest,
  useDeleteCollaborationRequest,
} from '../lib/hooks/useCollaboration';
import Navbar from '../components/Navbar';
import { Footer } from '../components/Footer';
import {
  ClipboardList,
  CheckCircle2,
  XCircle,
  Trash2,
  User,
  ArrowRight,
} from 'lucide-react';

export const CollaborationRequestsPage: React.FC = () => {
  const [myProjects, setMyProjects] = useState<any[]>([]);
  const [projectsLoaded, setProjectsLoaded] = useState(false);

  useEffect(() => {
    projectsAPI
      .getMyProjects()
      .then((res) => {
        const data = Array.isArray(res.data)
          ? res.data
          : res.data?.results ?? [];
        setMyProjects(data);
      })
      .finally(() => setProjectsLoaded(true));
  }, []);

  const requestQueries = useQueries({
    queries: myProjects.map((project) => ({
      queryKey: ['collaboration-requests', project.id],
      queryFn: async () => {
        const res = await collaborationAPI.getRequests(project.id);
        const data = Array.isArray(res.data)
          ? res.data
          : res.data?.results ?? [];
        return data.map((req: any) => ({
          ...req,
          project_id: project.id,
          project_title: project.title,
        }));
      },
      enabled: projectsLoaded && myProjects.length > 0,
    })),
  });

  const isLoading =
    !projectsLoaded || requestQueries.some((q) => q.isLoading);

  const allRequests = requestQueries
    .flatMap((q) => q.data ?? [])
    .sort(
      (a: any, b: any) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

  const acceptMutation = useAcceptCollaborationRequest();
  const rejectMutation = useRejectCollaborationRequest();
  const deleteMutation = useDeleteCollaborationRequest();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-[#0a0f1e]">
      <Navbar />
      <main className="flex-grow max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Collaboration Requests
          </h1>
          <p className="text-gray-500 dark:text-slate-400 mt-2">
            Manage incoming requests across all your projects
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
          </div>
        ) : myProjects.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-[#161d2e] rounded-2xl border border-gray-100 dark:border-white/[0.07]">
            <ClipboardList className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No projects yet
            </h3>
            <p className="text-gray-500 dark:text-slate-400 mb-6">
              Create a project to start receiving collaboration requests.
            </p>
            <Link
              to="/projects/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
            >
              Create Project <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : allRequests.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-[#161d2e] rounded-2xl border border-gray-100 dark:border-white/[0.07]">
            <ClipboardList className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No requests yet
            </h3>
            <p className="text-gray-500 dark:text-slate-400">
              You haven't received any collaboration requests.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {allRequests.map((req: any) => {
              const isPending = req.status === 'pending';
              const isAccepted = req.status === 'accepted';

              return (
                <div
                  key={`${req.project_id}-${req.id}`}
                  className="bg-white dark:bg-[#161d2e] rounded-xl border border-gray-100 dark:border-white/[0.07] p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isAccepted
                            ? 'bg-green-50 dark:bg-green-500/10'
                            : req.status === 'rejected'
                            ? 'bg-red-50 dark:bg-red-500/10'
                            : 'bg-amber-50 dark:bg-amber-500/10'
                        }`}
                      >
                        <User
                          className={`w-5 h-5 ${
                            isAccepted
                              ? 'text-green-600 dark:text-green-400'
                              : req.status === 'rejected'
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-amber-600 dark:text-amber-400'
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {req.applicant_name}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-slate-500">
                            ({req.applicant_email})
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                              isAccepted
                                ? 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400'
                                : req.status === 'rejected'
                                ? 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400'
                            }`}
                          >
                            {req.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
                          wants to collaborate on{' '}
                          <span className="font-medium text-gray-700 dark:text-slate-300">
                            {req.project_title}
                          </span>
                          {req.need_skill && (
                            <span> · {req.need_skill}</span>
                          )}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-slate-300 mt-2 bg-gray-50 dark:bg-white/[0.04] rounded-lg p-3">
                          {req.message}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-slate-500 mt-2">
                          Phone: {req.phone_number}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-start">
                      {isPending ? (
                        <>
                          <button
                            onClick={() =>
                              acceptMutation.mutate({
                                projectId: req.project_id,
                                requestId: req.id,
                              })
                            }
                            disabled={acceptMutation.isPending}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Accept
                          </button>
                          <button
                            onClick={() =>
                              rejectMutation.mutate({
                                projectId: req.project_id,
                                requestId: req.id,
                              })
                            }
                            disabled={rejectMutation.isPending}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 dark:bg-red-500/10 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 disabled:opacity-50 transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                'Are you sure you want to delete this request?'
                              )
                            ) {
                              deleteMutation.mutate({
                                projectId: req.project_id,
                                requestId: req.id,
                              });
                            }
                          }}
                          disabled={deleteMutation.isPending}
                          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-500 bg-gray-100 dark:bg-white/[0.06] dark:text-slate-400 rounded-lg hover:bg-gray-200 dark:hover:bg-white/[0.1] disabled:opacity-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};