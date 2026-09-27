import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import API from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Award, UserCheck, Star, MessageSquare } from 'lucide-react';

export const StudentPeerEvalPage = () => {
  const queryClient = useQueryClient();
  const [selectedTeammateId, setSelectedTeammateId] = useState('');
  const [contributionScore, setContributionScore] = useState(8);
  const [teamworkScore, setTeamworkScore] = useState(9);
  const [technicalScore, setTechnicalScore] = useState(8);
  const [communicationScore, setCommunicationScore] = useState(9);
  const [comments, setComments] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch Teammates
  const { data: teamData, isLoading: isTeamLoading } = useQuery({
    queryKey: ['evalTeammates'],
    queryFn: async () => {
      const res = await API.get('/supervision/teammates');
      return res.data;
    },
  });

  // Submit Peer Evaluation Mutation
  const evalMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await API.post('/supervision/peer-evaluations', payload);
      return res.data;
    },
    onSuccess: () => {
      setSuccessMsg('Peer evaluation submitted successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
      setComments('');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedTeammateId) return;
    evalMutation.mutate({
      evaluateeId: selectedTeammateId,
      contributionScore,
      teamworkScore,
      technicalScore,
      communicationScore,
      comments,
    });
  };

  if (isTeamLoading) return <LoadingSpinner text="Loading Teammates..." />;

  const teammates = teamData?.teammates || [];

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Peer Evaluation & 360 Review</h1>
              <StatusBadge status="ACTIVE" customLabel="Peer Assessment" />
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Evaluate group teammates on Contribution, Teamwork, Technical Skills, and Communication.
            </p>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm font-semibold">
          {successMsg}
        </div>
      )}

      {teammates.length === 0 ? (
        <div className="bg-white p-8 rounded-xl border border-slate-200 text-center space-y-2">
          <UserCheck className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-sm font-semibold text-slate-700">No other group members found to evaluate.</p>
          <p className="text-xs text-slate-500">You must be part of a project group with at least 2 accepted members.</p>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs max-w-2xl space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Select Teammate to Evaluate *</label>
              <select
                value={selectedTeammateId}
                onChange={(e) => setSelectedTeammateId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select Teammate</option>
                {teammates.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name} ({t.enrollmentNumber})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Contribution (1-10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={contributionScore}
                  onChange={(e) => setContributionScore(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Teamwork & Collaboration (1-10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={teamworkScore}
                  onChange={(e) => setTeamworkScore(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Technical Quality (1-10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={technicalScore}
                  onChange={(e) => setTechnicalScore(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Communication (1-10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={communicationScore}
                  onChange={(e) => setCommunicationScore(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Constructive Feedback & Comments</label>
              <textarea
                rows="3"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Specific positive feedback or areas for improvement..."
                className="w-full p-3 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={evalMutation.isPending || !selectedTeammateId}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-md transition-all"
            >
              {evalMutation.isPending ? 'Submitting...' : 'Submit Peer Assessment'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default StudentPeerEvalPage;
