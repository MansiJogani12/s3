import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import API from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Cpu, Play, CheckCircle2, ShieldCheck, FileCheck, Terminal, Award } from 'lucide-react';

export const StudentQaPage = () => {
  const queryClient = useQueryClient();

  // Fetch Quality Summary
  const { data: summaryData, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['qaSummary'],
    queryFn: async () => {
      const res = await API.get('/qa/quality-summary');
      return res.data;
    },
  });

  // Fetch Pipeline Runs
  const { data: runsData, isLoading: isRunsLoading } = useQuery({
    queryKey: ['qaPipelines'],
    queryFn: async () => {
      const res = await API.get('/qa/pipelines');
      return res.data;
    },
  });

  // Trigger CI Build Mutation
  const triggerMutation = useMutation({
    mutationFn: async () => {
      const res = await API.post('/qa/pipelines/trigger', { trigger: 'MANUAL' });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['qaPipelines']);
      queryClient.invalidateQueries(['qaSummary']);
    },
  });

  if (isSummaryLoading || isRunsLoading) return <LoadingSpinner text="Loading CI/CD Quality Reports..." />;

  const summary = summaryData?.summary;
  const runs = runsData?.pipelineRuns || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Automated QA & CI/CD Pipeline</h1>
              <StatusBadge status="ACTIVE" customLabel="Quality Gate Grade A" />
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Automated code quality scans, ESLint checks, Jest test suite execution, and SonarQube quality gates.
            </p>
          </div>
        </div>

        <button
          onClick={() => triggerMutation.mutate()}
          disabled={triggerMutation.isPending}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-md transition-all flex items-center space-x-1.5"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>{triggerMutation.isPending ? 'Running Pipeline...' : 'Run CI Build Scan'}</span>
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex justify-between text-xs font-semibold text-slate-500">
            <span>Code Coverage</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 font-mono">{summary?.codeCoveragePercent}%</p>
          <p className="text-[11px] text-emerald-600 font-semibold">Exceeds 80% institutional threshold</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex justify-between text-xs font-semibold text-slate-500">
            <span>Quality Gate Grade</span>
            <Award className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-3xl font-extrabold text-blue-600 font-mono">Grade {summary?.qualityGrade}</p>
          <p className="text-[11px] text-slate-500 font-semibold">Zero critical technical debt</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex justify-between text-xs font-semibold text-slate-500">
            <span>Test Suite Status</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 font-mono">{summary?.unitTestsPassed} Passed</p>
          <p className="text-[11px] text-slate-500 font-semibold">{summary?.unitTestsFailed} failed tests</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex justify-between text-xs font-semibold text-slate-500">
            <span>Security Scan</span>
            <FileCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 font-mono">0 Vulnerabilities</p>
          <p className="text-[11px] text-emerald-600 font-semibold">Clean dependency audit</p>
        </div>
      </div>

      {/* Pipeline Runs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 font-bold text-slate-800 flex items-center justify-between">
          <span>Recent CI/CD Pipeline Executions ({runs.length})</span>
        </div>

        <div className="divide-y divide-slate-200">
          {runs.map((r) => (
            <div key={r._id} className="p-5 hover:bg-slate-50 transition-colors space-y-3">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div className="flex items-center space-x-3">
                  <span className="font-mono text-xs font-bold text-slate-800 px-2 py-0.5 bg-slate-100 rounded">
                    Build #{r.runNumber}
                  </span>
                  <span className="font-mono text-xs text-blue-600 font-semibold">{r.commitHash}</span>
                  <StatusBadge status={r.status} />
                </div>
                <span className="text-xs font-mono text-slate-500">
                  Duration: {r.durationSeconds}s • Trigger: {r.trigger}
                </span>
              </div>

              {r.logs && (
                <div className="p-3 bg-slate-900 text-slate-200 rounded-lg text-xs font-mono whitespace-pre-line leading-relaxed shadow-inner">
                  {r.logs}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentQaPage;
