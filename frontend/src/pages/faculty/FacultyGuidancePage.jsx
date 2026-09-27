import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import API from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { BookOpen, Plus, Star, Calendar, UserCheck, X } from 'lucide-react';

export const FacultyGuidancePage = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [topic, setTopic] = useState('');
  const [discussionSummary, setDiscussionSummary] = useState('');
  const [rating, setRating] = useState(4);
  const [formError, setFormError] = useState('');

  // Fetch Faculty Supervision Summary (projects assigned)
  const { data: summaryData, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['supervisionSummary'],
    queryFn: async () => {
      const res = await API.get('/supervision/summary');
      return res.data;
    },
  });

  // Fetch Guidance Logs
  const { data: logsData, isLoading: isLogsLoading } = useQuery({
    queryKey: ['supervisionLogs', selectedProjectId],
    queryFn: async () => {
      const params = {};
      if (selectedProjectId) params.projectId = selectedProjectId;
      const res = await API.get('/supervision/guidance', { params });
      return res.data;
    },
  });

  // Create Guidance Log Mutation
  const createLogMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await API.post('/supervision/guidance', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['supervisionLogs']);
      setIsModalOpen(false);
      setTopic('');
      setDiscussionSummary('');
      setFormError('');
    },
    onError: (err) => {
      setFormError(err.response?.data?.message || 'Failed to record guidance log.');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');
    if (!selectedProjectId || !topic.trim() || !discussionSummary.trim()) {
      setFormError('Please select a project group, topic, and summary.');
      return;
    }
    createLogMutation.mutate({ projectId: selectedProjectId, topic, discussionSummary, rating });
  };

  if (isSummaryLoading || isLogsLoading) return <LoadingSpinner text="Loading Guidance Logbook..." />;

  const summaries = summaryData?.summaries || [];
  const logs = logsData?.logs || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Faculty Guidance & Logbook</h1>
              <StatusBadge status="ACTIVE" customLabel="Supervision Journal" />
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Record meeting topics, discussion summaries, actionable advice, and progress star ratings for assigned project groups.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-md transition-all flex items-center space-x-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Record Meeting Log</span>
        </button>
      </div>

      {/* Guidance Logs List */}
      <div className="space-y-4">
        {logs.length === 0 ? (
          <p className="text-xs text-slate-400 italic text-center py-12 bg-white rounded-xl border border-slate-200">
            No guidance logbook entries recorded yet.
          </p>
        ) : (
          logs.map((log) => (
            <div key={log._id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{log.topic}</h3>
                  <div className="flex items-center space-x-3 text-xs text-slate-500 mt-0.5">
                    <span>Guide: <span className="font-semibold text-slate-700">{log.facultyId?.name}</span></span>
                    <span>Date: <span className="font-mono">{new Date(log.meetingDate).toLocaleDateString()}</span></span>
                  </div>
                </div>

                <div className="flex items-center space-x-1 text-amber-500">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${star <= log.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                    />
                  ))}
                </div>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100 font-medium">
                {log.discussionSummary}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Record Guidance Meeting Log</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && <div className="mt-3 p-2 bg-rose-50 text-rose-700 rounded text-xs">{formError}</div>}

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Select Project Group *</label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Student Project</option>
                  {summaries.map((s) => (
                    <option key={s.project._id} value={s.project._id}>
                      {s.project.title} ({s.project.groupId?.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Meeting Topic *</label>
                <input
                  type="text"
                  required
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Architecture Review & Sprint 1 Retrospective"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Discussion & Actionable Guidance *</label>
                <textarea
                  rows="4"
                  required
                  value={discussionSummary}
                  onChange={(e) => setDiscussionSummary(e.target.value)}
                  placeholder="Summary of meeting discussion and advice provided to students..."
                  className="w-full p-3 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Progress Rating (1-5 Stars)</label>
                <select
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                >
                  <option value={5}>5 Stars - Excellent Progress</option>
                  <option value={4}>4 Stars - Good Progress</option>
                  <option value={3}>3 Stars - Satisfactory</option>
                  <option value={2}>2 Stars - Needs Improvement</option>
                  <option value={1}>1 Star - Unsatisfactory</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 text-xs font-medium">Cancel</button>
                <button type="submit" disabled={createLogMutation.isPending} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm">
                  {createLogMutation.isPending ? 'Saving...' : 'Save Log Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyGuidancePage;
