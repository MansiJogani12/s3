import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { useQuery } from '@tanstack/react-query';
import API from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { FolderGit2, FileText, Award, Layers, Users, TrendingUp, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const FacultyDashboard = () => {
  const { user } = useAuthStore();

  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['supervisionSummary'],
    queryFn: async () => {
      const res = await API.get('/supervision/summary');
      return res.data;
    }
  });

  const { data: proposalData, isLoading: proposalsLoading } = useQuery({
    queryKey: ['assignedProposalsDashboard'],
    queryFn: async () => {
      const res = await API.get('/proposals/assigned');
      return res.data;
    }
  });

  if (summaryLoading || proposalsLoading) return <LoadingSpinner text="Loading Faculty Dashboard..." />;

  const projects = summaryData?.summaries || [];
  const totalAssigned = projects.length;
  
  const proposals = proposalData?.proposals || [];
  const pendingProposals = proposals.filter(p => p.status === 'SUBMITTED' || p.status === 'UNDER_REVIEW').length;
  const completedReviews = proposals.filter(p => p.status === 'APPROVED' || p.status === 'REVISION_REQUESTED').length;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              Faculty Guide Dashboard
            </h1>
            <StatusBadge status="ACTIVE" customLabel="Assigned Scope" />
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Welcome back, <span className="font-semibold text-slate-700">{user?.name}</span>. Assigned projects review portal.
          </p>
        </div>
        <div className="text-xs font-mono bg-emerald-50 px-3 py-1.5 rounded-lg text-emerald-700 font-semibold">
          Role: FACULTY
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/faculty/projects" className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow cursor-pointer block group">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider group-hover:text-blue-600 transition-colors">Assigned Projects</span>
            <FolderGit2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-800">{totalAssigned}</div>
        </Link>

        <Link to="/faculty/proposals" className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow cursor-pointer block group">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider group-hover:text-amber-600 transition-colors">Pending Proposals</span>
            <FileText className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-800">{pendingProposals}</div>
        </Link>

        <Link to="/faculty/proposals" className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow cursor-pointer block group">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider group-hover:text-emerald-600 transition-colors">Completed Reviews</span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-800">{completedReviews}</div>
        </Link>
      </div>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Layers className="w-5 h-5 text-indigo-500"/> Project Execution Analytics</h3>
          <p className="text-sm text-slate-500 mb-6">Monitor the development progress, agile metrics, and health of all groups you are guiding.</p>
          <Link to="/faculty/analytics" className="inline-flex items-center justify-center w-full px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-sm font-semibold transition-colors">
            View Analytics Dashboard
          </Link>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Award className="w-5 h-5 text-purple-500"/> Marks Entry & Evaluations</h3>
          <p className="text-sm text-slate-500 mb-6">Enter official presentation marks and provide structured rubric-based feedback for project groups.</p>
          <div className="flex gap-2">
            <Link to="/faculty/marks" className="inline-flex items-center justify-center flex-1 px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-sm font-semibold transition-colors">
              Enter Marks
            </Link>
            <Link to="/faculty/reviews" className="inline-flex items-center justify-center flex-1 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-sm font-semibold transition-colors">
              Peer Reviews
            </Link>
          </div>
        </div>
      </div>
      
      {/* Active Groups Overview */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
          <Users className="w-5 h-5 text-slate-600" />
          <h3 className="font-bold text-slate-800">Your Active Project Groups</h3>
        </div>
        <div className="p-0">
          {projects.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">No active groups assigned to you yet.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {projects.map(({ project, metrics }) => (
                <div key={project._id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                  <div>
                    <h4 className="font-bold text-slate-800">{project.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-mono bg-slate-200 text-slate-700 px-2 py-0.5 rounded">Group: {project.projectKey}</span>
                      <button
                        onClick={() => {
                          navigate(`/faculty/group/${project._id}`);
                        }}
                        className="text-xs text-blue-600 hover:underline font-medium"
                      >
                        View Workspace
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center justify-center p-2 bg-emerald-50 rounded-lg min-w-[80px]">
                       <span className="text-lg font-bold text-emerald-600">{metrics.taskCompletionRate}%</span>
                       <span className="text-[10px] uppercase font-bold text-emerald-800">Progress</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-2 bg-rose-50 rounded-lg min-w-[80px]">
                       <span className="text-lg font-bold text-rose-600 flex items-center gap-1">
                          {metrics.openBugs > 0 && <AlertTriangle className="w-3 h-3"/>} {metrics.openBugs}
                       </span>
                       <span className="text-[10px] uppercase font-bold text-rose-800">Open Bugs</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-2 bg-blue-50 rounded-lg min-w-[80px]">
                       <span className="text-lg font-bold text-blue-600">{metrics.logsCount}</span>
                       <span className="text-[10px] uppercase font-bold text-blue-800">Meetings</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default FacultyDashboard;
