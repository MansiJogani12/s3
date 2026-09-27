import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import API from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { Users, UserCheck, Search, Filter, CheckCircle2, AlertCircle } from 'lucide-react';

export const AdminFacultyAssignPage = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch all groups & proposals
  const { data: groupData, isLoading: isGroupsLoading } = useQuery({
    queryKey: ['adminAllGroups', search],
    queryFn: async () => {
      const res = await API.get('/groups', { params: { search } });
      return res.data;
    },
  });

  // Fetch proposals to get projects
  const { data: proposalData } = useQuery({
    queryKey: ['adminAllProposals'],
    queryFn: async () => {
      const res = await API.get('/proposals/assigned');
      return res.data;
    },
  });

  // Fetch Faculty users
  const { data: facultyUsersData } = useQuery({
    queryKey: ['facultyUsers'],
    queryFn: async () => {
      const res = await API.get('/admin/users', { params: { role: 'FACULTY' } });
      return res.data;
    },
  });

  // Assign Guide Mutation
  const assignGuideMutation = useMutation({
    mutationFn: async ({ projectId, facultyGuideId }) => {
      const res = await API.post(`/proposals/${projectId}/assign-guide`, { facultyGuideId });
      return res.data;
    },
    onSuccess: (resData) => {
      queryClient.invalidateQueries(['adminAllProposals']);
      queryClient.invalidateQueries(['adminAllGroups']);
      setSuccessMsg(resData.message || 'Faculty Guide assigned successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
    },
  });

  const groups = groupData?.groups || [];
  const proposals = proposalData?.proposals || [];
  const facultyUsers = facultyUsersData?.users || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Faculty Guide Assignment</h1>
            <StatusBadge status="ACTIVE" customLabel="Institutional Governance" />
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Assign department faculty guides to supervise student project groups.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filter */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="relative w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search group name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Roster Table */}
      {isGroupsLoading ? (
        <LoadingSpinner text="Fetching groups and project assignments..." />
      ) : groups.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No groups found"
          description="No project groups match your search criteria."
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-3">Group Code</th>
                  <th className="px-6 py-3">Group Name</th>
                  <th className="px-6 py-3">Leader</th>
                  <th className="px-6 py-3">Members Count</th>
                  <th className="px-6 py-3">Assigned Faculty Guide</th>
                  <th className="px-6 py-3 text-right">Assign Guide</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {groups.map((grp) => {
                  const proj = proposals.find((p) => String(p.groupId?._id || p.groupId) === String(grp._id));
                  const currentGuide = proj?.facultyGuideId;

                  return (
                    <tr key={grp._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-blue-700">{grp.code}</td>
                      <td className="px-6 py-4 font-semibold text-slate-900">{grp.name}</td>
                      <td className="px-6 py-4 text-xs font-medium">
                        <span className="font-semibold text-slate-800">{grp.leaderId?.name}</span> (
                        <span className="font-mono">{grp.leaderId?.enrollmentNumber}</span>)
                      </td>
                      <td className="px-6 py-4 font-mono text-center font-bold text-slate-700">
                        {grp.members?.length || 1}
                      </td>
                      <td className="px-6 py-4 text-xs font-medium">
                        {currentGuide ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            <UserCheck className="w-3.5 h-3.5 mr-1" /> {currentGuide.name}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {proj ? (
                          <select
                            value={currentGuide?._id || ''}
                            onChange={(e) => {
                              if (e.target.value) {
                                assignGuideMutation.mutate({
                                  projectId: proj._id,
                                  facultyGuideId: e.target.value,
                                });
                              }
                            }}
                            className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select Guide</option>
                            {facultyUsers.map((f) => (
                              <option key={f._id} value={f._id}>
                                {f.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Draft Proposal Missing</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFacultyAssignPage;
