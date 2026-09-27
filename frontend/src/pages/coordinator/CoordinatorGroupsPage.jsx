import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import API from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import {
  Users,
  Search,
  Filter,
  GraduationCap,
  FolderGit2,
  UserCheck,
  ChevronDown,
  ChevronUp,
  Shield,
} from 'lucide-react';

export const CoordinatorGroupsPage = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedGroupId, setExpandedGroupId] = useState(null);

  // Fetch all groups
  const { data: groupData, isLoading: isGroupsLoading, error: groupsError } = useQuery({
    queryKey: ['coordinatorGroups', search, statusFilter],
    queryFn: async () => {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await API.get('/groups', { params });
      return res.data;
    },
  });

  // Fetch proposals for project association
  const { data: proposalData } = useQuery({
    queryKey: ['coordinatorGroupProposals'],
    queryFn: async () => {
      const res = await API.get('/proposals/assigned');
      return res.data;
    },
  });

  const groups = groupData?.groups || [];
  const proposals = proposalData?.proposals || [];

  // Filter by status (client-side as backend may not support it)
  const filteredGroups = statusFilter
    ? groups.filter((g) => g.status === statusFilter)
    : groups;

  const getProjectForGroup = (groupId) =>
    proposals.find((p) => String(p.groupId?._id || p.groupId) === String(groupId));

  const statusColors = {
    FORMING: 'bg-amber-50 text-amber-700 border-amber-200',
    ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    LOCKED: 'bg-blue-50 text-blue-700 border-blue-200',
    DISBANDED: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Student Project Groups</h1>
            <StatusBadge status="ACTIVE" customLabel="Department Oversight" />
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Monitor and oversee all student project groups, team compositions, project assignments, and faculty guide allocations.
          </p>
        </div>
        <div className="text-xs font-mono bg-indigo-50 border border-indigo-200 text-indigo-700 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5" /> {filteredGroups.length} Groups
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search group name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="FORMING">Forming</option>
              <option value="ACTIVE">Active</option>
              <option value="LOCKED">Locked</option>
              <option value="DISBANDED">Disbanded</option>
            </select>
          </div>
        </div>
      </div>

      {/* Groups List */}
      {isGroupsLoading ? (
        <LoadingSpinner text="Fetching department project groups..." />
      ) : groupsError ? (
        <div className="p-4 bg-rose-50 text-rose-700 rounded-lg text-sm">Failed to load group data.</div>
      ) : filteredGroups.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No project groups found"
          description="No student groups match your current search or filter criteria."
        />
      ) : (
        <div className="space-y-4">
          {filteredGroups.map((grp) => {
            const isExpanded = expandedGroupId === grp._id;
            const project = getProjectForGroup(grp._id);
            const memberCount = grp.members?.length || 0;

            return (
              <div
                key={grp._id}
                className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden transition-all"
              >
                {/* Group Header */}
                <div className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center space-x-3 flex-wrap gap-y-1">
                      <span className="px-2 py-0.5 bg-slate-100 font-mono font-bold text-xs text-slate-700 rounded">
                        {grp.code}
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 truncate">{grp.name}</h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${statusColors[grp.status] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                        {grp.status}
                      </span>
                    </div>

                    <div className="flex items-center space-x-4 text-xs text-slate-500 font-medium flex-wrap gap-y-1">
                      <span className="flex items-center gap-1">
                        <GraduationCap className="w-3.5 h-3.5" />
                        Leader: <span className="font-semibold text-slate-800">{grp.leaderId?.name}</span>
                        {grp.leaderId?.enrollmentNumber && (
                          <span className="font-mono text-blue-600">({grp.leaderId.enrollmentNumber})</span>
                        )}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        Members: <span className="font-bold text-slate-800">{memberCount}</span>
                      </span>
                      {grp.departmentId && (
                        <span>
                          Dept: <span className="font-semibold text-slate-800">{grp.departmentId.code || grp.departmentId.name}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    {/* Project Status */}
                    {project ? (
                      <div className="flex items-center gap-2">
                        <FolderGit2 className="w-4 h-4 text-purple-600" />
                        <StatusBadge status={project.status} />
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic flex items-center gap-1">
                        <FolderGit2 className="w-3.5 h-3.5" /> No project
                      </span>
                    )}

                    {/* Faculty Guide */}
                    {(grp.guideId || project?.facultyGuideId) ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        <UserCheck className="w-3.5 h-3.5 mr-1" /> {(grp.guideId?.name || project?.facultyGuideId?.name)}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-200">
                        Guide Unassigned
                      </span>
                    )}

                    <button
                      onClick={() => setExpandedGroupId(isExpanded ? null : grp._id)}
                      className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50"
                    >
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details: Members List & Project Info */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-3 border-t border-slate-100 bg-slate-50 space-y-4 animate-in fade-in">
                    {/* Members Table */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Team Members ({memberCount})
                      </h4>
                      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                            <tr>
                              <th className="px-4 py-2">Name</th>
                              <th className="px-4 py-2">Enrollment</th>
                              <th className="px-4 py-2">Role</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {(grp.members || []).map((m) => (
                              <tr key={m._id} className="hover:bg-slate-50/50">
                                <td className="px-4 py-2 font-medium text-slate-800">
                                  {m.userId?.name || 'Unknown'}
                                </td>
                                <td className="px-4 py-2 font-mono text-blue-600 text-xs">
                                  {m.userId?.enrollmentNumber || '—'}
                                </td>
                                <td className="px-4 py-2">
                                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                    m.role === 'LEADER'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}>
                                    {m.role}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Project Info */}
                    {project && (
                      <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                          Associated Project
                        </h4>
                        <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-2">
                          <div className="flex items-center space-x-3">
                            <span className="px-2 py-0.5 bg-slate-100 font-mono font-bold text-xs text-slate-700 rounded">
                              {project.projectKey}
                            </span>
                            <h5 className="font-bold text-slate-900 text-sm">{project.title}</h5>
                            <StatusBadge status={project.status} />
                          </div>
                          {project.domain && (
                            <p className="text-xs text-slate-600">
                              <span className="font-semibold text-slate-700">Domain:</span> {project.domain}
                            </p>
                          )}
                          {project.problemStatement && (
                            <p className="text-xs text-slate-600 leading-relaxed mt-1">
                              <span className="font-semibold text-slate-700">Problem:</span> {project.problemStatement}
                            </p>
                          )}
                          {project.techStack?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {project.techStack.map((t) => (
                                <span
                                  key={t}
                                  className="px-2 py-0.5 bg-slate-50 border border-slate-200 text-slate-600 text-xs font-mono rounded"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CoordinatorGroupsPage;
