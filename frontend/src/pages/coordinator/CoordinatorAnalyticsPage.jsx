import React from 'react';
import { useQuery } from '@tanstack/react-query';
import API from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Sparkles, Award, Download, TrendingUp, Shield } from 'lucide-react';

export const CoordinatorAnalyticsPage = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['coordinatorDeptAnalytics'],
    queryFn: async () => {
      const res = await API.get('/platform/analytics');
      return res.data;
    },
  });

  if (isLoading) return <LoadingSpinner text="Loading Department Analytics..." />;

  const kpis = data?.kpis;
  const gradeDist = kpis?.gradeDistribution || {};

  const handleExportCsv = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      `Metric,Value\nTotal Students,${kpis?.totalStudents}\nTotal Faculty,${kpis?.totalFaculty}\nTotal Groups,${kpis?.totalGroups}\nApproved Projects,${kpis?.approvedProjects}\nAvg Task Completion %,${kpis?.avgTaskCompletionRate}%\nDefect Resolution %,${kpis?.defectResolutionRate}%`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'TeamSync_Department_Analytics_Report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Department Analytics & KPIs</h1>
              <StatusBadge status="ACTIVE" customLabel="Coordinator Insight" />
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Department-level performance metrics: student groups, project approvals, task execution, and grade distributions.
            </p>
          </div>
        </div>

        <button
          onClick={handleExportCsv}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-md flex items-center space-x-1.5"
        >
          <Download className="w-4 h-4" />
          <span>Export Report (CSV)</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Student Groups</span>
          <p className="text-3xl font-extrabold text-slate-900 font-mono">{kpis?.totalGroups}</p>
          <p className="text-[11px] text-slate-500">{kpis?.totalStudents} enrolled students</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Approved Projects</span>
          <p className="text-3xl font-extrabold text-emerald-600 font-mono">{kpis?.approvedProjects}</p>
          <p className="text-[11px] text-slate-500">{kpis?.pendingProposals} pending proposals</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Task Completion Rate</span>
          <p className="text-3xl font-extrabold text-blue-600 font-mono">{kpis?.avgTaskCompletionRate}%</p>
          <p className="text-[11px] text-slate-500">{kpis?.completedTasks} / {kpis?.totalTasks} tasks done</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Defect Resolution Rate</span>
          <p className="text-3xl font-extrabold text-purple-600 font-mono">{kpis?.defectResolutionRate}%</p>
          <p className="text-[11px] text-slate-500">{kpis?.resolvedBugs} / {kpis?.totalBugs} defects resolved</p>
        </div>
      </div>

      {/* Grade Distribution */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
        <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center">
          <Award className="w-4 h-4 mr-2 text-amber-500" />
          Department Grade Distribution
        </h3>

        {Object.keys(gradeDist).length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500 text-sm">
            No grade data available yet. Marks will appear after faculty evaluation.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {Object.entries(gradeDist).map(([grade, count]) => (
              <div key={grade} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 text-center space-y-1">
                <span className="text-xl font-extrabold text-slate-900 font-mono block">{grade}</span>
                <span className="text-2xl font-bold text-blue-600 block">{count}</span>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Students</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CoordinatorAnalyticsPage;
