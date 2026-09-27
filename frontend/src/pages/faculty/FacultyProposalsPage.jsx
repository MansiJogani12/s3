import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import API from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import {
  FolderGit2,
  CheckCircle,
  XCircle,
  RotateCcw,
  AlertTriangle,
  FileText,
  Search,
  Filter,
  UserCheck,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';

export const FacultyProposalsPage = ({ specificGroupId = null }) => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedProposalId, setExpandedProposalId] = useState(null);

  // Review Modal State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [reviewAction, setReviewAction] = useState('APPROVE');
  const [feedbackText, setFeedbackText] = useState('');
  const [formError, setFormError] = useState('');

  // Fetch Assigned Proposals
  const { data, isLoading, error } = useQuery({
    queryKey: ['assignedProposals', search, statusFilter, specificGroupId],
    queryFn: async () => {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (specificGroupId) params.groupId = specificGroupId;
      const res = await API.get('/proposals/assigned', { params });
      return res.data;
    },
  });

  // Review Mutation
  const reviewMutation = useMutation({
    mutationFn: async ({ proposalId, action, feedback }) => {
      const res = await API.post(`/proposals/${proposalId}/review`, { action, feedback });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['assignedProposals']);
      setIsReviewModalOpen(false);
      setSelectedProposal(null);
      setFeedbackText('');
      setFormError('');
    },
    onError: (err) => {
      setFormError(err.response?.data?.message || 'Failed to submit review.');
    },
  });

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (['REQUEST_REVISION', 'REJECT'].includes(reviewAction) && !feedbackText.trim()) {
      setFormError('Feedback text is mandatory when requesting revision or rejecting a proposal.');
      return;
    }

    reviewMutation.mutate({
      proposalId: selectedProposal._id,
      action: reviewAction,
      feedback: feedbackText,
    });
  };

  const proposals = data?.proposals || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Proposal Reviews</h1>
            <StatusBadge status="ACTIVE" customLabel="Faculty Review Desk" />
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Inspect submitted student project proposals, review AI similarity checks, and grant approvals.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title, key, or domain..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="SUBMITTED">Submitted / Pending</option>
              <option value="RESUBMITTED">Resubmitted</option>
              <option value="APPROVED">Approved</option>
              <option value="CHANGE_REQUESTED">Change Requested</option>
              <option value="CHANGE_APPROVED">Change Approved</option>
              <option value="REVISION_REQUIRED">Revision Requested</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Proposals List */}
      {isLoading ? (
        <LoadingSpinner text="Fetching assigned proposals..." />
      ) : error ? (
        <div className="p-4 bg-rose-50 text-rose-700 rounded-lg text-sm">Failed to load proposal data.</div>
      ) : proposals.length === 0 ? (
        <EmptyState
          icon={FolderGit2}
          title="No proposals pending review"
          description="There are currently no proposals assigned matching your filter."
        />
      ) : (
        <div className="space-y-4">
          {proposals.map((prop) => {
            const isExpanded = expandedProposalId === prop._id;
            return (
              <div
                key={prop._id}
                className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden transition-all"
              >
                {/* Header Row */}
                <div className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-3">
                      <span className="px-2 py-0.5 bg-slate-100 font-mono font-bold text-xs text-slate-700 rounded">
                        {prop.projectKey}
                      </span>
                      <h3 className="text-lg font-bold text-slate-900">{prop.title}</h3>
                      <StatusBadge status={prop.status} />
                    </div>

                    <div className="flex items-center space-x-4 text-xs text-slate-500 font-medium">
                      <span>Group: <span className="font-semibold text-slate-800">{prop.groupId?.name}</span></span>
                      <span>Leader: <span className="font-mono text-blue-600 font-semibold">{prop.groupId?.leaderId?.enrollmentNumber}</span> ({prop.groupId?.leaderId?.name})</span>
                      <span>Domain: <span className="text-slate-700">{prop.domain}</span></span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {/* Similarity Badge */}
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center space-x-1 ${
                        prop.similarityScore >= 40
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>{prop.similarityScore}% Similarity</span>
                    </div>

                    <button
                      onClick={() => setExpandedProposalId(isExpanded ? null : prop._id)}
                      className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50"
                    >
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>

                    <button
                      onClick={() => {
                        setSelectedProposal(prop);
                        setReviewAction(prop.status === 'CHANGE_REQUESTED' ? 'APPROVE_EDIT_REQUEST' : 'APPROVE');
                        setFeedbackText('');
                        setFormError('');
                        setIsReviewModalOpen(true);
                      }}
                      className={`px-4 py-1.5 text-white rounded-lg text-xs font-semibold shadow-xs ${prop.status === 'CHANGE_REQUESTED' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                      {prop.status === 'CHANGE_REQUESTED' ? 'Handle Edit Request' : 'Review Proposal'}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-3 border-t border-slate-100 bg-slate-50 space-y-4 animate-in fade-in">
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Problem Statement
                      </h4>
                      <p className="text-xs text-slate-700 bg-white p-3 rounded-lg border border-slate-200">
                        {prop.problemStatement || 'No problem statement drafted.'}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Tech Stack
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {(prop.techStack || []).map((t) => (
                          <span
                            key={t}
                            className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 text-xs font-mono rounded-md"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    {prop.objectives?.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Objectives
                        </h4>
                        <ul className="list-disc list-inside text-xs text-slate-700 space-y-1 bg-white p-3 rounded-lg border border-slate-200">
                          {prop.objectives.map((obj, idx) => (
                            <li key={idx}>{obj}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      {isReviewModalOpen && selectedProposal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Faculty Review & Decision</h3>
              <button onClick={() => setIsReviewModalOpen(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mt-2">
              Review decision for <span className="font-bold text-slate-800">{selectedProposal.title}</span> (
              <span className="font-semibold">{selectedProposal.groupId?.name}</span>).
            </p>

            {formError && <div className="mt-3 p-2 bg-rose-50 text-rose-700 rounded text-xs">{formError}</div>}

            <form onSubmit={handleReviewSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-2">
                  Review Action *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewAction('APPROVE')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center border transition-all ${
                      reviewAction === 'APPROVE'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-300'
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5 mr-1" /> {selectedProposal?.status === 'CHANGE_REQUESTED' ? 'Keep Approved (Deny)' : 'Approve'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setReviewAction(selectedProposal?.status === 'CHANGE_REQUESTED' ? 'APPROVE_EDIT_REQUEST' : 'REQUEST_REVISION')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center border transition-all ${
                      ['REQUEST_REVISION', 'APPROVE_EDIT_REQUEST'].includes(reviewAction)
                        ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-300'
                    }`}
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1" /> {selectedProposal?.status === 'CHANGE_REQUESTED' ? 'Allow Edit' : 'Revision'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setReviewAction('REJECT')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center border transition-all ${
                      reviewAction === 'REJECT'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-300'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Faculty Feedback & Comments {reviewAction !== 'APPROVE' && '*'}
                </label>
                <textarea
                  rows="4"
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Provide structured feedback for the student project group..."
                  className="w-full p-3 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="px-4 py-2 text-slate-600 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewMutation.isPending}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm"
                >
                  {reviewMutation.isPending ? 'Submitting...' : 'Submit Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyProposalsPage;
