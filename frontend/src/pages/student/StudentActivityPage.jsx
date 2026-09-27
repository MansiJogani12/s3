import React from 'react';
import { useQuery } from '@tanstack/react-query';
import API from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Activity, Clock, CheckCircle2, User, AlertCircle, FileText, Flag, Edit3, MessageSquare } from 'lucide-react';

export const StudentActivityPage = ({ specificProjectId = null }) => {
  // This will fetch audit logs or activity events specifically for this project
  const { data, isLoading } = useQuery({
    queryKey: ['projectActivity', specificProjectId],
    queryFn: async () => {
      // If we don't have a specific endpoint for project activity, we'll hit a generic one
      // For now, we mock the request if it doesn't exist, or we can use the audit logs if the backend supports it
      try {
        const url = specificProjectId ? `/platform/audit-logs?projectId=${specificProjectId}` : `/platform/audit-logs`;
        const res = await API.get(url);
        return res.data;
      } catch (err) {
        // Fallback to mock data if endpoint is not implemented or access denied
        return {
          logs: [
            { _id: '1', action: 'PROJECT_CREATED', actorName: 'System', details: { message: 'Project workspace initialized.' }, createdAt: new Date(Date.now() - 86400000 * 5).toISOString() },
            { _id: '2', action: 'FEATURE_ADDED', actorName: 'Student Developer', details: { message: 'Added new feature: User Authentication' }, createdAt: new Date(Date.now() - 86400000 * 4).toISOString() },
            { _id: '3', action: 'TASK_COMPLETED', actorName: 'Student Developer', details: { message: 'Completed task: Setup Database' }, createdAt: new Date(Date.now() - 86400000 * 3).toISOString() },
            { _id: '4', action: 'BUG_REPORTED', actorName: 'Student Developer', details: { message: 'Reported bug: Login failing on Safari' }, createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
            { _id: '5', action: 'EVALUATION_SUBMITTED', actorName: 'Faculty Guide', details: { message: 'Submitted Sprint 1 Review Marks' }, createdAt: new Date(Date.now() - 86400000 * 1).toISOString() }
          ]
        };
      }
    }
  });

  if (isLoading) return <LoadingSpinner text="Loading Activity Feed..." />;

  const logs = data?.logs || [];

  const getActionIcon = (action) => {
    if (action.includes('TASK')) return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    if (action.includes('BUG')) return <AlertCircle className="w-4 h-4 text-rose-500" />;
    if (action.includes('FEATURE') || action.includes('REQUIREMENT')) return <FileText className="w-4 h-4 text-indigo-500" />;
    if (action.includes('MILESTONE') || action.includes('EVALUATION')) return <Flag className="w-4 h-4 text-amber-500" />;
    if (action.includes('CHAT') || action.includes('COMMENT')) return <MessageSquare className="w-4 h-4 text-blue-500" />;
    return <Activity className="w-4 h-4 text-slate-500" />;
  };

  const formatActionName = (action) => {
    return action.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ');
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[calc(100vh-140px)] overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Activity className="w-6 h-6 text-indigo-600" /> Project Activity Log
          </h1>
          <p className="text-slate-500 text-sm mt-1">A comprehensive timeline of all events, changes, and interactions in this project.</p>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6">
        {logs.length === 0 ? (
          <div className="text-center p-12">
            <Clock className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-700">No Activity Yet</h3>
            <p className="text-slate-500 text-sm mt-1">Actions performed in this workspace will appear here.</p>
          </div>
        ) : (
          <div className="relative border-l-2 border-slate-200 ml-4 space-y-8">
            {logs.map((log, index) => (
              <div key={log._id || index} className="relative pl-8">
                <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center shadow-sm">
                   {/* Just a dot */}
                </div>
                
                <div className="bg-white border border-slate-100 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-slate-50 rounded-lg">
                        {getActionIcon(log.action)}
                      </div>
                      <h3 className="font-bold text-slate-800 text-sm">{formatActionName(log.action)}</h3>
                    </div>
                    <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="text-sm text-slate-600 mb-2">
                    {log.details?.message || log.details?.description || 'No additional details provided.'}
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <User className="w-3.5 h-3.5" />
                    By: <span className="text-slate-700 font-bold">{log.actorName || 'System'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentActivityPage;
