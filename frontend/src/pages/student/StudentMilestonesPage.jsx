import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import API from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Target, Calendar, CheckSquare, Square, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

export const StudentMilestonesPage = ({ facultyMode = false, specificProjectId = null }) => {
  const queryClient = useQueryClient();

  // Fetch Milestones
  const { data, isLoading } = useQuery({
    queryKey: ['agileMilestones', specificProjectId],
    queryFn: async () => {
      const url = specificProjectId ? `/collaboration/milestones?projectId=${specificProjectId}` : '/collaboration/milestones';
      const res = await API.get(url);
      return res.data;
    },
  });

  const updateMilestoneMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await API.put(`/collaboration/milestones/${payload._id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['agileMilestones']);
    },
  });

  const milestones = data?.milestones || [];

  const handleToggleRequirement = (milestone, reqIndex) => {
    // Clone milestone to avoid direct mutation
    const updatedMilestone = { ...milestone, requirements: [...(milestone.requirements || [])] };
    
    // Toggle completion
    updatedMilestone.requirements[reqIndex] = {
      ...updatedMilestone.requirements[reqIndex],
      isCompleted: !updatedMilestone.requirements[reqIndex].isCompleted
    };

    // Recalculate progress
    const totalReqs = updatedMilestone.requirements.length;
    const completedReqs = updatedMilestone.requirements.filter(r => r.isCompleted).length;
    
    if (totalReqs > 0) {
      updatedMilestone.progressPercentage = Math.round((completedReqs / totalReqs) * 100);
    }

    // Auto-update status based on progress
    if (updatedMilestone.progressPercentage === 100) {
      updatedMilestone.status = 'COMPLETED';
    } else if (updatedMilestone.progressPercentage > 0) {
      updatedMilestone.status = 'IN_PROGRESS';
    } else {
      updatedMilestone.status = 'NOT_STARTED';
    }

    updateMilestoneMutation.mutate(updatedMilestone);
  };

  if (isLoading) return <LoadingSpinner text="Loading Project Milestones..." />;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Project Milestones</h1>
            <p className="text-sm text-slate-500 mt-1">
              Track official academic deadlines and complete required deliverables.
            </p>
          </div>
        </div>
      </div>

      {/* Milestones Dashboard */}
      {milestones.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
          <Target className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-700">No Active Milestones</h3>
          <p className="text-slate-500 mt-2 max-w-md mx-auto">
            Your coordinator or faculty guide hasn't assigned any milestones yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {milestones.map((m) => {
            const isOfficial = m.type === 'OFFICIAL';
            const requirements = m.requirements || [];
            const completedCount = requirements.filter(r => r.isCompleted).length;
            const totalCount = requirements.length;
            const progress = m.progressPercentage || 0;
            const expected = m.expectedProgress || 0;
            
            // Status Logic
            const isCompleted = m.status === 'COMPLETED' || progress === 100;
            let statusTag = '';
            let statusColor = '';

            if (isCompleted) {
               statusTag = 'Completed ✅';
               statusColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
            } else if (new Date(m.targetDate) < new Date()) {
               statusTag = 'Overdue 🔴';
               statusColor = 'text-rose-700 bg-rose-50 border-rose-200';
            } else if (progress >= expected) {
               statusTag = 'On Track 🟢';
               statusColor = 'text-green-700 bg-green-50 border-green-200';
            } else if (progress < expected && (expected - progress) <= 25) {
               statusTag = 'Slightly Behind 🟡';
               statusColor = 'text-amber-700 bg-amber-50 border-amber-200';
            } else {
               statusTag = 'Behind Schedule 🔴';
               statusColor = 'text-rose-700 bg-rose-50 border-rose-200';
            }

            return (
              <div key={m._id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                {/* Milestone Header */}
                <div className={`p-5 border-b border-slate-100 ${isOfficial ? 'bg-slate-50/50' : 'bg-purple-50/30'}`}>
                  <div className="flex justify-between items-start mb-3">
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md ${isOfficial ? 'bg-slate-200 text-slate-700' : 'bg-purple-200 text-purple-800'}`}>
                      {isOfficial ? '🌐 Official Milestone' : '👨‍🏫 Faculty Milestone'}
                    </span>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${statusColor}`}>
                      {statusTag}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-slate-800 leading-tight mb-2">{m.title}</h3>
                  
                  <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                    <span className="flex items-center gap-1.5 bg-white px-2 py-1 rounded border border-slate-200 shadow-xs">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" /> 
                      Deadline: <strong className="text-slate-700">{new Date(m.targetDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
                    </span>
                    <span className="flex items-center gap-1.5 bg-white px-2 py-1 rounded border border-slate-200 shadow-xs">
                      <Target className="w-3.5 h-3.5 text-amber-500" />
                      Expected: <strong className="text-slate-700">{expected}%</strong>
                    </span>
                  </div>
                </div>

                {/* Progress Bar Section */}
                <div className="p-5 border-b border-slate-100">
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">Your Progress</span>
                      <span className="text-2xl font-black text-slate-800">{progress}%</span>
                    </div>
                    {progress < expected && !isCompleted && new Date(m.targetDate) >= new Date() && (
                      <span className="flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-md border border-rose-100">
                        <AlertTriangle className="w-3.5 h-3.5" /> You are behind!
                      </span>
                    )}
                  </div>
                  
                  {/* Progress Bar Visual */}
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex relative border border-slate-200/50">
                    <div 
                      className={`h-full transition-all duration-500 ease-out ${progress >= expected ? 'bg-emerald-500' : 'bg-indigo-500'}`} 
                      style={{ width: `${progress}%` }}
                    />
                    {/* Expected Marker line */}
                    {expected > 0 && expected < 100 && (
                      <div 
                        className="absolute top-0 bottom-0 w-0.5 bg-slate-800 z-10" 
                        style={{ left: `${expected}%` }}
                        title={`Expected: ${expected}%`}
                      />
                    )}
                  </div>
                </div>

                {/* Requirements Checklist */}
                <div className="p-5 flex-1 bg-slate-50/30">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Required Work</h4>
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{completedCount} / {totalCount} Completed</span>
                  </div>
                  
                  {totalCount === 0 ? (
                    <p className="text-sm text-slate-400 italic">No specific requirements listed.</p>
                  ) : (
                    <ul className="space-y-3">
                      {requirements.map((req, idx) => (
                        <li 
                          key={idx} 
                          className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${!facultyMode ? 'cursor-pointer' : ''} ${
                            req.isCompleted 
                              ? 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100' 
                              : 'bg-white border-slate-200 shadow-sm hover:border-indigo-300'
                          }`}
                          onClick={() => !facultyMode && handleToggleRequirement(m, idx)}
                        >
                          <button 
                            disabled={facultyMode}
                            className={`mt-0.5 shrink-0 transition-colors ${req.isCompleted ? 'text-emerald-600' : 'text-slate-300 hover:text-indigo-400'}`}
                          >
                            {req.isCompleted ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                          </button>
                          <span className={`text-sm font-medium transition-all ${req.isCompleted ? 'text-emerald-800 line-through opacity-70' : 'text-slate-700'}`}>
                            {req.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentMilestonesPage;
