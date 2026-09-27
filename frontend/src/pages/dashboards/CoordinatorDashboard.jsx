import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import API from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  GraduationCap,
  Users,
  FolderGit2,
  CheckCircle2,
  Clock,
  UserCheck,
  Award,
  BarChart3,
  ArrowRight,
  Shield,
  Layers,
} from 'lucide-react';

export const CoordinatorDashboard = () => {
  const { user } = useAuthStore();

  // Fetch Department Analytics & KPIs
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['coordinatorAnalytics'],
    queryFn: async () => {
      const res = await API.get('/platform/analytics');
      return res.data;
    },
  });

  // Fetch Proposals for department overview
  const { data: proposalsData, isLoading: proposalsLoading } = useQuery({
    queryKey: ['coordinatorProposals'],
    queryFn: async () => {
      const res = await API.get('/proposals/assigned');
      return res.data;
    },
  });

  const kpis = analyticsData?.kpis || {
    totalStudents: 0,
    totalGroups: 0,
    totalProjects: 0,
    approvedProjects: 0,
    pendingProposals: 0,
    assignedGuides: 0,
  };

  const proposals = proposalsData?.proposals || [];
  const pendingProposals = proposals.filter(
    (p) => p.status === 'SUBMITTED' || p.status === 'RESUBMITTED' || p.status === 'UNDER_REVIEW'
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-800">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold tracking-tight">Department Coordinator Portal</h1>
            <StatusBadge status="ACTIVE" customLabel="Coordinator Active" />
          </div>
          <p className="text-sm text-slate-300 mt-1">
            Welcome back, <span className="font-semibold text-white">{user?.name}</span>. Overseeing department SGP cycles, proposal approvals, and faculty guide assignments.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-xs font-mono bg-blue-600/30 border border-blue-500/40 text-blue-300 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" /> Department Manager
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      {analyticsLoading ? (
        <LoadingSpinner message="Loading department dashboard metrics..." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-blue-300 transition-colors">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Dept Students</span>
              <GraduationCap className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-slate-900">{kpis.totalStudents}</div>
            <p className="text-xs text-slate-500 mt-1">Enrolled SGP students</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-colors">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Project Groups</span>
              <Users className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="text-3xl font-bold text-slate-900">{kpis.totalGroups}</div>
            <p className="text-xs text-slate-500 mt-1">Active student teams</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-amber-300 transition-colors">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Pending Reviews</span>
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div className="text-3xl font-bold text-amber-600">{pendingProposals.length}</div>
            <p className="text-xs text-slate-500 mt-1">Proposals awaiting review</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-purple-300 transition-colors">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Approved Projects</span>
              <CheckCircle2 className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-purple-700">{kpis.approvedProjects}</div>
            <p className="text-xs text-slate-500 mt-1">Approved for development</p>
          </div>
        </div>
      )}

      {/* Quick Action Workflows */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-600" /> Coordinator Management Workflows
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/coordinator/faculty-assign"
            className="p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 transition-all group"
          >
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <UserCheck className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-800 text-sm group-hover:text-blue-600">Assign Faculty Guides</h3>
            <p className="text-xs text-slate-500 mt-1">Allocate faculty supervisors to student project groups.</p>
            <div className="mt-3 flex items-center text-xs font-semibold text-blue-600">
              Manage Guide Allocations <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </Link>

          <Link
            to="/coordinator/projects"
            className="p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-purple-500 hover:bg-purple-50/40 transition-all group"
          >
            <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-800 text-sm group-hover:text-purple-600">Proposal Reviews</h3>
            <p className="text-xs text-slate-500 mt-1">Review SGP proposals, AI similarity scores, and status history.</p>
            <div className="mt-3 flex items-center text-xs font-semibold text-purple-600">
              View All Proposals <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </Link>

          <Link
            to="/coordinator/reviews"
            className="p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 transition-all group"
          >
            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-800 text-sm group-hover:text-emerald-600">Rubrics & Evaluation</h3>
            <p className="text-xs text-slate-500 mt-1">Configure evaluation criteria, review stages, and marks.</p>
            <div className="mt-3 flex items-center text-xs font-semibold text-emerald-600">
              Evaluation Settings <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </Link>

          <Link
            to="/coordinator/analytics"
            className="p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/40 transition-all group"
          >
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-800 text-sm group-hover:text-indigo-600">Department Analytics</h3>
            <p className="text-xs text-slate-500 mt-1">Track task completion rates, grade distributions, and export CSVs.</p>
            <div className="mt-3 flex items-center text-xs font-semibold text-indigo-600">
              View Analytics <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </Link>
        </div>
      </div>

      {/* Pending Proposals Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600" /> Proposals Pending Action ({pendingProposals.length})
          </h2>
          <Link to="/coordinator/projects" className="text-xs font-semibold text-blue-600 hover:underline">
            View All Proposals
          </Link>
        </div>

        {proposalsLoading ? (
          <LoadingSpinner message="Fetching pending proposals..." />
        ) : pendingProposals.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500 text-sm">
            No proposals currently pending review in your department.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Project Title</th>
                  <th className="py-3 px-4">Domain</th>
                  <th className="py-3 px-4">Group Leader</th>
                  <th className="py-3 px-4">Faculty Guide</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {pendingProposals.slice(0, 5).map((project) => (
                  <tr key={project._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-800">{project.title}</td>
                    <td className="py-3 px-4 text-slate-600">{project.domain || 'N/A'}</td>
                    <td className="py-3 px-4 text-slate-600">
                      {project.groupId?.leaderId?.name || 'Assigned'}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {project.facultyGuideId ? project.facultyGuideId.name : <span className="text-amber-600 font-medium">Unassigned</span>}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={project.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to="/coordinator/projects"
                        className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors"
                      >
                        Review Proposal
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoordinatorDashboard;
