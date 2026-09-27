import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import API from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import { ShieldAlert, Clock, CheckCircle2, XCircle, Search, Filter, Plus, ChevronRight, X } from 'lucide-react';

export const StudentPermissionsPage = ({ facultyMode = false, specificProjectId = null, specificGroupId = null }) => {
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestForm, setRequestForm] = useState({ type: 'GITHUB_URL', reason: '', requestedValue: '' });
  const [facultyComment, setFacultyComment] = useState('');

  // Mock data for now since we haven't implemented the backend endpoint for general permission requests
  // We'll use a local state to simulate data if backend fails, or just build the UI to be ready
  const { data, isLoading } = useQuery({
    queryKey: ['permissionRequests', specificGroupId, specificProjectId],
    queryFn: async () => {
      try {
        // Fetch notifications for the faculty to see actionable requests
        const res = await API.get('/platform/notifications');
        const notifications = res.data.notifications || [];
        
        // Filter actionable notifications
        const actionables = notifications.filter(n => n.actionType);
        
        return {
          requests: actionables.map(n => {
            // Extract URL from message for GitHub repo changes
            let requestedValue = 'N/A';
            let currentValue = 'N/A';
            
            if (n.actionType === 'GITHUB_REPO_CHANGE') {
               const match = n.message.match(/to (https?:\/\/[^\s]+)/);
               if (match) requestedValue = match[1];
               else if (n.message.includes('disconnect')) requestedValue = 'Disconnect Repository';
               else {
                 const words = n.message.split(' ');
                 requestedValue = words[words.length - 1].replace('.', '');
               }
            }

            return {
              _id: n._id,
              type: n.actionType,
              typeLabel: n.title || 'Permission Request',
              requestedBy: { name: 'Student' }, // We don't have the exact student name in notification usually, but we could parse
              createdAt: n.createdAt,
              currentValue: currentValue,
              requestedValue: requestedValue,
              reason: n.message.replace(' (Approved)', '').replace(' (Rejected)', ''),
              status: n.actionStatus || 'PENDING',
              facultyComment: n.isRead && n.actionStatus !== 'PENDING' ? `Marked as ${n.actionStatus}` : ''
            };
          })
        };
      } catch (err) {
        return { requests: [] };
      }
    }
  });

  const createRequestMutation = useMutation({
    mutationFn: async (payload) => {
      // Mock API call
      return { success: true, payload };
    },
    onSuccess: () => {
      setIsRequestModalOpen(false);
      setRequestForm({ type: 'GITHUB_URL', reason: '', requestedValue: '' });
      alert("Permission request submitted successfully.");
    }
  });

  const reviewRequestMutation = useMutation({
    mutationFn: async ({ id, action, comment }) => {
      const res = await API.put(`/platform/notifications/${id}/action`, { action });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['permissionRequests']);
      setSelectedRequest(null);
      setFacultyComment('');
    }
  });

  if (isLoading) return <LoadingSpinner text="Loading Permissions..." />;

  const requests = data?.requests || [];

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'APPROVED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'REJECTED': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'EXPIRED': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING': return <Clock className="w-3 h-3" />;
      case 'APPROVED': return <CheckCircle2 className="w-3 h-3" />;
      case 'REJECTED': return <XCircle className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6">
      <div className="flex-1 bg-white rounded-xl border border-slate-200 flex flex-col shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-indigo-600" /> Permissions & Requests
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {facultyMode ? "Review and approve student requests for project modifications." : "Request faculty approval for locked project data modifications."}
            </p>
          </div>
          {!facultyMode && (
            <button 
              onClick={() => setIsRequestModalOpen(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> New Request
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {requests.length === 0 ? (
            <div className="text-center p-12">
              <ShieldAlert className="w-16 h-16 text-slate-200 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-700">No Requests Found</h3>
              <p className="text-slate-500 text-sm mt-1">There are currently no permission requests for this group.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {requests.map(req => (
                <div key={req._id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-slate-400" /> {req.typeLabel}
                    </h3>
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center gap-1 border ${getStatusColor(req.status)}`}>
                      {getStatusIcon(req.status)} {req.status}
                    </span>
                  </div>
                  
                  <div className="text-xs text-slate-500 mb-4 flex-1">
                    <p className="mb-1"><span className="font-semibold text-slate-700">Requested by:</span> {req.requestedBy.name}</p>
                    <p><span className="font-semibold text-slate-700">Date:</span> {new Date(req.createdAt).toLocaleDateString()}</p>
                  </div>
                  
                  <button 
                    onClick={() => setSelectedRequest(req)}
                    className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-1"
                  >
                    View Details <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* REQUEST DETAILS MODAL */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50">
              <div>
                <span className={`inline-flex mb-3 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase flex items-center gap-1 border ${getStatusColor(selectedRequest.status)}`}>
                  {getStatusIcon(selectedRequest.status)} {selectedRequest.status}
                </span>
                <h2 className="text-xl font-bold text-slate-800">{selectedRequest.typeLabel}</h2>
                <p className="text-sm text-slate-500 mt-1">Requested by {selectedRequest.requestedBy.name} on {new Date(selectedRequest.createdAt).toLocaleString()}</p>
              </div>
              <button onClick={() => { setSelectedRequest(null); setFacultyComment(''); }} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5"/>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Current Value</span>
                  <p className="text-sm font-semibold text-slate-700 break-words">{selectedRequest.currentValue || 'N/A'}</p>
                </div>
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                  <span className="block text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1">Requested Value</span>
                  <p className="text-sm font-semibold text-indigo-700 break-words">{selectedRequest.requestedValue}</p>
                </div>
              </div>
              
              <div>
                <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Reason for Request</span>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-slate-700 italic">
                  "{selectedRequest.reason}"
                </div>
              </div>

              {selectedRequest.facultyComment && (
                <div>
                  <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Faculty Comments</span>
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-sm text-amber-800">
                    {selectedRequest.facultyComment}
                  </div>
                </div>
              )}
            </div>

            {facultyMode && selectedRequest.status === 'PENDING' && (
              <div className="p-6 border-t border-slate-100 bg-slate-50">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Add Comment (Required for Rejection)</label>
                <textarea 
                  value={facultyComment}
                  onChange={(e) => setFacultyComment(e.target.value)}
                  placeholder="Provide feedback on your decision..."
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all min-h-[80px] mb-4"
                />
                <div className="flex gap-3">
                  <button 
                    onClick={() => reviewRequestMutation.mutate({ id: selectedRequest._id, action: 'REJECT', comment: facultyComment })}
                    disabled={!facultyComment.trim()}
                    className="flex-1 px-4 py-2.5 bg-white border-2 border-rose-100 text-rose-600 hover:bg-rose-50 rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
                  >
                    Reject Request
                  </button>
                  <button 
                    onClick={() => reviewRequestMutation.mutate({ id: selectedRequest._id, action: 'APPROVE', comment: facultyComment })}
                    className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-colors shadow-sm"
                  >
                    Approve Change
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE REQUEST MODAL FOR STUDENTS */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" /> New Permission Request
              </h2>
              <button onClick={() => setIsRequestModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Request Type</label>
                <select 
                  value={requestForm.type}
                  onChange={(e) => setRequestForm({...requestForm, type: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="GITHUB_URL">Change GitHub Repository URL</option>
                  <option value="TECH_STACK">Change Tech Stack</option>
                  <option value="DEADLINE_EXTENSION">Task Deadline Extension</option>
                  <option value="EDIT_PROPOSAL">Edit Proposal Fields</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Requested Value</label>
                <input 
                  type="text"
                  value={requestForm.requestedValue}
                  onChange={(e) => setRequestForm({...requestForm, requestedValue: e.target.value})}
                  placeholder="e.g. github.com/new-organization/repo"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Reason</label>
                <textarea 
                  value={requestForm.reason}
                  onChange={(e) => setRequestForm({...requestForm, reason: e.target.value})}
                  placeholder="Why do you need this change?"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 min-h-[100px]"
                />
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => setIsRequestModalOpen(false)}
                className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-bold text-sm transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => createRequestMutation.mutate(requestForm)}
                disabled={!requestForm.requestedValue || !requestForm.reason}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-colors shadow-sm disabled:opacity-50"
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentPermissionsPage;
