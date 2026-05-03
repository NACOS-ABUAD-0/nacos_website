//src/pages/MyCollaborationsPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useMyCollaborations } from '../lib/hooks/useCollaboration';
import Navbar from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Users, ArrowRight, Code2 } from 'lucide-react';

export const MyCollaborationsPage: React.FC = () => {
  const { data: collaborations, isLoading } = useMyCollaborations();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-[#0a0f1e]">
      <Navbar />
      <main className="flex-grow max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Collaborations</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-2">Projects you are actively contributing to</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
          </div>
        ) : !collaborations || collaborations.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-[#161d2e] rounded-2xl border border-gray-100 dark:border-white/[0.07]">
            <Users className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No collaborations yet</h3>
            <p className="text-gray-500 dark:text-slate-400 mb-6">You haven't joined any projects as a collaborator.</p>
            <Link to="/collaboration-hub" className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors">
              Find Projects <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {collaborations.map((project: any) => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="flex items-start gap-4 p-5 bg-white dark:bg-[#161d2e] rounded-xl border border-gray-100 dark:border-white/[0.07] hover:border-green-200 dark:hover:border-green-500/30 hover:shadow-md transition-all"
              >
                <div className="w-10 h-10 bg-green-50 dark:bg-green-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Code2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{project.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 line-clamp-2">{project.description}</p>
                  {project.tags && project.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {project.tags.map((tag: any, i: number) => (
                        <span key={i} className="text-xs bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-slate-300 px-2 py-0.5 rounded-full">
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <ArrowRight className="w-5 h-5 text-gray-300 dark:text-slate-600 flex-shrink-0 mt-1" />
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};