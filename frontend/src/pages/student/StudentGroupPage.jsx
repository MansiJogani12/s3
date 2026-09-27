import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import API from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  Users,
  Plus,
  Crown,
  UserPlus,
  Check,
  X,
  LogOut,
  Mail,
  AlertCircle,
  CheckCircle2,
  Copy,
  KeyRound,
} from 'lucide-react';

export const StudentGroupPage = () => {
  const queryClient = useQueryClient();
  const [groupName, setGroupName] = useState('');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [inviteIdentifier, setInviteIdentifier] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  // Fetch student's group & invites
  const { data, isLoading } = useQuery({
    queryKey: ['myGroup'],
    queryFn: async () => {
      const res = await API.get('/groups/my-group');
      return res.data;
    },
  });

  // Create Group Mutation
  const createGroupMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await API.post('/groups', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myGroup']);
      setGroupName('');
      setErrorMessage('');
    },
    onError: (err) => {
      setErrorMessage(err.response?.data?.message || 'Failed to create group.');
    },
  });

  // Join Group By Code Mutation
  const joinByCodeMutation = useMutation({
    mutationFn: async (code) => {
      const res = await API.post('/groups/join-by-code', { code });
      return res.data;
    },
    onSuccess: (resData) => {
      queryClient.invalidateQueries(['myGroup']);
      setJoinCodeInput('');
      setSuccessMessage(resData.message || 'Joined group successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      setErrorMessage('');
    },
    onError: (err) => {
      setErrorMessage(err.response?.data?.message || 'Failed to join group.');
    },
  });

  // Invite Member Mutation
  const inviteMemberMutation = useMutation({
    mutationFn: async ({ groupId, searchIdentifier }) => {
      const res = await API.post(`/groups/${groupId}/invite`, { searchIdentifier });
      return res.data;
    },
    onSuccess: (resData) => {
      queryClient.invalidateQueries(['myGroup']);
      setInviteIdentifier('');
      setSuccessMessage(resData.message || 'Invitation sent!');
      setTimeout(() => setSuccessMessage(''), 3000);
      setErrorMessage('');
    },
    onError: (err) => {
      setErrorMessage(err.response?.data?.message || 'Failed to send invite.');
    },
  });

  // Respond Invite Mutation
  const respondInviteMutation = useMutation({
    mutationFn: async ({ inviteId, action }) => {
      const res = await API.post(`/groups/invites/${inviteId}/respond`, { action });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myGroup']);
    },
  });

  // Leave Group Mutation
  const leaveGroupMutation = useMutation({
    mutationFn: async (groupId) => {
      const res = await API.post(`/groups/${groupId}/leave`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myGroup']);
    },
  });

  // Remove Member Mutation
  const removeMemberMutation = useMutation({
    mutationFn: async ({ groupId, memberId }) => {
      const res = await API.delete(`/groups/${groupId}/members/${memberId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myGroup']);
      setSuccessMessage('Member removed successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    },
  });

  // Cancel Invite Mutation
  const cancelInviteMutation = useMutation({
    mutationFn: async (inviteId) => {
      const res = await API.delete(`/groups/invites/${inviteId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myGroup']);
      setSuccessMessage('Invitation cancelled');
      setTimeout(() => setSuccessMessage(''), 3000);
    },
  });

  // Mark Group Ready Mutation
  const markGroupReadyMutation = useMutation({
    mutationFn: async (groupId) => {
      const res = await API.put(`/groups/${groupId}/ready`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myGroup']);
      setSuccessMessage('Group marked as Ready for Proposal');
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    onError: (err) => {
      setErrorMessage(err.response?.data?.message || 'Failed to update group status.');
    }
  });

  const handleCreateGroupSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!groupName.trim()) {
      setErrorMessage('Group name is required.');
      return;
    }
    createGroupMutation.mutate({ name: groupName });
  };

  const handleJoinByCodeSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!joinCodeInput.trim()) {
      setErrorMessage('Please enter a valid Group Code.');
      return;
    }
    joinByCodeMutation.mutate(joinCodeInput);
  };

  const handleInviteSubmit = (e, groupId) => {
    e.preventDefault();
    setErrorMessage('');
    if (!inviteIdentifier.trim()) {
      setErrorMessage('Enter an enrollment number or email address.');
      return;
    }
    inviteMemberMutation.mutate({ groupId, searchIdentifier: inviteIdentifier });
  };

  if (isLoading) return <LoadingSpinner text="Loading group information..." />;

  const hasGroup = data?.hasGroup;
  const group = data?.group;
  const members = data?.members || [];
  const userRoleInGroup = data?.userRoleInGroup;
  const pendingInvites = data?.pendingInvites || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Project Group</h1>
              <StatusBadge status={hasGroup ? 'ACTIVE' : 'PLANNED'} customLabel={hasGroup ? group?.status : 'Unassigned'} />
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Form your SGP project team, join an existing group using Group Code, or manage group members.
            </p>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Case 1: Student belongs to an active group */}
      {hasGroup && group ? (
        <div className="space-y-6">
          {/* Group Overview Banner */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center space-x-3">
                <h2 className="text-2xl font-extrabold tracking-tight">{group.name}</h2>
                <span className="px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded-full text-xs font-mono font-semibold">
                  {group.status || 'FORMING'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 font-mono mb-2">
                Group Code: <span className="text-white font-bold">{group.code}</span>
              </p>
              
              <div className="flex items-center text-xs font-medium text-slate-300 bg-white/5 rounded-lg px-3 py-1.5 inline-flex border border-white/10">
                <Users className="w-3.5 h-3.5 mr-1.5" />
                {members.length} / {group.maxMembers || 4} Members (Min: {group.minMembers || 2})
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {userRoleInGroup === 'LEADER' && group.status === 'FORMING' && members.length >= (group.minMembers || 2) && (
                <button
                  onClick={() => {
                    if (window.confirm('Mark this group as ready for proposal? You will no longer be able to remove members directly.')) {
                      markGroupReadyMutation.mutate(group._id);
                    }
                  }}
                  disabled={markGroupReadyMutation.isPending}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{markGroupReadyMutation.isPending ? 'Updating...' : 'Ready for Proposal'}</span>
                </button>
              )}

              <button
                onClick={() => {
                  navigator.clipboard.writeText(group.code);
                  setCopiedCode(true);
                  setTimeout(() => setCopiedCode(false), 2000);
                }}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-semibold text-slate-200 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedCode ? 'Code Copied!' : 'Copy Code'}</span>
              </button>

              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to leave this project group?')) {
                    leaveGroupMutation.mutate(group._id);
                  }
                }}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Leave Group</span>
              </button>
            </div>
          </div>
          
          {(group.status === 'LOCKED' || group.status === 'ACTIVE' || group.status === 'APPROVED') && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm flex items-start space-x-3">
              <Lock className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <strong className="block text-amber-900 font-bold">🔒 GROUP LOCKED</strong>
                This project has been approved. Group membership can no longer be changed directly. Contact your faculty guide or coordinator for changes.
              </div>
            </div>
          )}

          {/* Group Status Timeline */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Workflow Progress</h3>
            <div className="flex items-center text-xs font-semibold overflow-x-auto pb-2">
              <div className={`flex items-center ${group.status !== 'FORMING' ? 'text-emerald-600' : 'text-blue-600'}`}>
                {group.status !== 'FORMING' ? <CheckCircle2 className="w-4 h-4 mr-1" /> : <div className="w-2 h-2 rounded-full bg-blue-600 mr-2"></div>}
                Group Formed
              </div>
              <div className="w-8 h-px bg-slate-300 mx-2"></div>
              <div className={`flex items-center ${(group.status === 'READY_FOR_PROPOSAL' || group.status === 'PROPOSAL_SUBMITTED' || group.status === 'APPROVED' || group.status === 'ACTIVE') ? 'text-emerald-600' : 'text-slate-400'}`}>
                {(group.status === 'PROPOSAL_SUBMITTED' || group.status === 'APPROVED' || group.status === 'ACTIVE') ? <CheckCircle2 className="w-4 h-4 mr-1" /> : <div className={`w-2 h-2 rounded-full mr-2 ${group.status === 'READY_FOR_PROPOSAL' ? 'bg-blue-600' : 'bg-slate-300'}`}></div>}
                Ready for Proposal
              </div>
              <div className="w-8 h-px bg-slate-300 mx-2"></div>
              <div className={`flex items-center ${(group.status === 'PROPOSAL_SUBMITTED' || group.status === 'APPROVED' || group.status === 'ACTIVE') ? 'text-emerald-600' : 'text-slate-400'}`}>
                {(group.status === 'APPROVED' || group.status === 'ACTIVE') ? <CheckCircle2 className="w-4 h-4 mr-1" /> : <div className={`w-2 h-2 rounded-full mr-2 ${group.status === 'PROPOSAL_SUBMITTED' ? 'bg-blue-600' : 'bg-slate-300'}`}></div>}
                Proposal Submitted
              </div>
              <div className="w-8 h-px bg-slate-300 mx-2"></div>
              <div className={`flex items-center ${(group.status === 'APPROVED' || group.status === 'ACTIVE') ? 'text-emerald-600' : 'text-slate-400'}`}>
                {(group.status === 'ACTIVE') ? <CheckCircle2 className="w-4 h-4 mr-1" /> : <div className={`w-2 h-2 rounded-full mr-2 ${group.status === 'APPROVED' ? 'bg-blue-600' : 'bg-slate-300'}`}></div>}
                Proposal Approved
              </div>
              <div className="w-8 h-px bg-slate-300 mx-2"></div>
              <div className={`flex items-center ${group.status === 'ACTIVE' ? 'text-emerald-600' : 'text-slate-400'}`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${group.status === 'ACTIVE' ? 'bg-blue-600' : 'bg-slate-300'}`}></div>
                Development Active
              </div>
            </div>
          </div>

          {/* Members Roster */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 flex items-center">
                <Users className="w-5 h-5 mr-2 text-blue-600" />
                Group Members ({members.length})
              </h3>
              {userRoleInGroup === 'LEADER' && (
                <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full font-semibold flex items-center">
                  <Crown className="w-3.5 h-3.5 mr-1 text-amber-500" /> You are Group Leader
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {members.map((member) => (
                <div
                  key={member._id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start justify-between"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-bold text-slate-800 text-base">{member.user?.name}</h4>
                      {member.role === 'LEADER' && (
                        <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center">
                          <Crown className="w-3 h-3 mr-0.5" /> Leader
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-blue-600 font-mono font-semibold mt-0.5">
                      {member.user?.enrollmentNumber}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">{member.user?.email}</p>

                    {/* Member Skills */}
                    {member.user?.profile?.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {member.user.profile.skills.map((s) => (
                          <span
                            key={s}
                            className="px-2 py-0.5 bg-white text-slate-600 border border-slate-200 rounded text-[10px] font-medium"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {userRoleInGroup === 'LEADER' && member.role !== 'LEADER' && group.status === 'FORMING' && (
                    <button
                      onClick={() => {
                        if (window.confirm('Remove this member from the group?')) {
                          removeMemberMutation.mutate({ groupId: group._id, memberId: member.user._id });
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                      title="Remove Member"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Invite Teammates Section (Only visible to Leader) */}
            {userRoleInGroup === 'LEADER' && (
              <div className="mt-6 pt-6 border-t border-slate-200">
                <h4 className="text-sm font-bold text-slate-800 flex items-center mb-3">
                  <UserPlus className="w-4 h-4 mr-1.5 text-blue-600" />
                  Invite Classmate to Group
                </h4>
                <form onSubmit={(e) => handleInviteSubmit(e, group._id)} className="flex gap-2 max-w-lg">
                  <input
                    type="text"
                    value={inviteIdentifier}
                    onChange={(e) => setInviteIdentifier(e.target.value)}
                    placeholder="Enter student enrollment number (e.g. 24IT002)..."
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                  <button
                    type="submit"
                    disabled={inviteMemberMutation.isPending || members.length >= (group.maxMembers || 4)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm"
                  >
                    {inviteMemberMutation.isPending ? 'Sending...' : 'Send Invite'}
                  </button>
                </form>
              </div>
            )}
            
            {userRoleInGroup === 'LEADER' && group.status === 'FORMING' && data?.sentInvites?.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-200">
                <h4 className="text-sm font-bold text-slate-800 flex items-center mb-3">
                  📨 Pending Invitations Sent
                </h4>
                <div className="space-y-2">
                  {data.sentInvites.map((inv) => (
                    <div key={inv._id} className="flex items-center justify-between p-2.5 border border-slate-200 rounded-lg bg-slate-50">
                      <div>
                        <div className="text-sm font-semibold text-slate-800">{inv.invitee?.name || inv.searchIdentifier}</div>
                        <div className="text-xs text-slate-500">Invitation Pending</div>
                      </div>
                      <button
                        onClick={() => {
                          if(window.confirm('Cancel this invitation?')) {
                            cancelInviteMutation.mutate(inv._id);
                          }
                        }}
                        className="px-3 py-1 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded text-xs font-semibold transition-colors"
                      >
                        Cancel Invitation
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Case 2: Student has no active group */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Join Group By Code Card */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Join Group by Code</h3>
                <p className="text-xs text-slate-500">
                  Enter a Group Code provided by your team leader.
                </p>
              </div>
            </div>

            <form onSubmit={handleJoinByCodeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Group Code *
                </label>
                <input
                  type="text"
                  required
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value)}
                  placeholder="e.g. GRP-2026-X639"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 font-mono uppercase"
                />
              </div>

              <button
                type="submit"
                disabled={joinByCodeMutation.isPending}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-md transition-all flex items-center justify-center"
              >
                {joinByCodeMutation.isPending ? 'Joining...' : 'Join Group'}
              </button>
            </form>
          </div>

          {/* Create Group Card */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Create New Group</h3>
                <p className="text-xs text-slate-500">
                  Form a new project team as the Group Leader.
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateGroupSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Project Group Name *
                </label>
                <input
                  type="text"
                  required
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g. Smart Campus Innovators"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={createGroupMutation.isPending}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-md transition-all flex items-center justify-center"
              >
                {createGroupMutation.isPending ? 'Creating Group...' : 'Form Group & Become Leader'}
              </button>
            </form>
          </div>

          {/* Pending Invitations Card */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 flex items-center">
                <Mail className="w-5 h-5 mr-2 text-indigo-600" />
                Group Invitations ({pendingInvites.length})
              </h3>
            </div>

            {pendingInvites.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-6 text-center">
                You have no pending group invitations.
              </p>
            ) : (
              <div className="space-y-3">
                {pendingInvites.map((invite) => (
                  <div
                    key={invite._id}
                    className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-between"
                  >
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">
                        {invite.groupId?.name || 'Project Group'}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Invited by <span className="font-semibold">{invite.invitedBy?.name}</span> (
                        <span className="font-mono">{invite.invitedBy?.enrollmentNumber}</span>)
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() =>
                          respondInviteMutation.mutate({ inviteId: invite._id, action: 'ACCEPT' })
                        }
                        className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center shadow-xs"
                        title="Accept Invitation"
                      >
                        <Check className="w-4 h-4 mr-1" /> Accept
                      </button>
                      <button
                        onClick={() =>
                          respondInviteMutation.mutate({ inviteId: invite._id, action: 'REJECT' })
                        }
                        className="p-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold flex items-center"
                        title="Reject Invitation"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentGroupPage;
