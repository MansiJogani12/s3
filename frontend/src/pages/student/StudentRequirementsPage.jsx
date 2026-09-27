import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import API from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { ClipboardList, Plus, X, GitCommit, CheckCircle2 } from 'lucide-react';

export const StudentRequirementsPage = ({ facultyMode = false, specificProjectId = null }) => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('LIST');

  // Form State
  const [editingReqId, setEditingReqId] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('FUNCTIONAL');
  const [priority, setPriority] = useState('MEDIUM');
  const [status, setStatus] = useState('PLANNED');
  const [linkedFeatures, setLinkedFeatures] = useState([]);

  // Fetch Requirements
  const { data: reqData, isLoading: isReqLoading } = useQuery({
    queryKey: ['agileRequirements', specificProjectId],
    queryFn: async () => {
      const url = specificProjectId ? `/agile/requirements?projectId=${specificProjectId}` : '/agile/requirements';
      const res = await API.get(url);
      return res.data;
    },
  });

  // Fetch Traceability Chain
  const { data: traceData, isLoading: isTraceLoading } = useQuery({
    queryKey: ['agileTraceability', specificProjectId],
    queryFn: async () => {
      const url = specificProjectId ? `/agile/traceability?projectId=${specificProjectId}` : '/agile/traceability';
      const res = await API.get(url);
      return res.data;
    },
  });

  // Fetch Features (for linking)
  const { data: featureData } = useQuery({
    queryKey: ['agileFeatures', specificProjectId],
    queryFn: async () => {
      const url = specificProjectId ? `/agile/features?projectId=${specificProjectId}` : '/agile/features';
      const res = await API.get(url);
      return res.data;
    },
  });

  const features = featureData?.features || [];

  const createReqMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await API.post('/agile/requirements', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['agileRequirements']);
      queryClient.invalidateQueries(['agileTraceability']);
      setIsModalOpen(false);
      resetForm();
    },
  });

  const updateReqMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await API.put(`/agile/requirements/${editingReqId}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['agileRequirements']);
      queryClient.invalidateQueries(['agileTraceability']);
      setIsModalOpen(false);
      resetForm();
    },
  });

  const deleteReqMutation = useMutation({
    mutationFn: async (id) => {
      const res = await API.delete(`/agile/requirements/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['agileRequirements']);
      queryClient.invalidateQueries(['agileTraceability']);
    },
    onError: (err) => {
      alert(err.response?.data?.message || 'Failed to delete requirement');
    }
  });

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setType('FUNCTIONAL');
    setPriority('MEDIUM');
    setStatus('PLANNED');
    setLinkedFeatures([]);
    setEditingReqId(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    const payload = { title, description, type, priority, status, linkedFeatures };
    if (editingReqId) {
      updateReqMutation.mutate(payload);
    } else {
      createReqMutation.mutate(payload);
    }
  };

  const handleEdit = (req) => {
    setEditingReqId(req._id);
    setTitle(req.title);
    setDescription(req.description || '');
    setType(req.type || 'FUNCTIONAL');
    setPriority(req.priority);
    setStatus(req.status || 'PLANNED');
    setLinkedFeatures(req.linkedFeatures || []);
    setIsModalOpen(true);
  };

  const handleDelete = (req) => {
    if (window.confirm(`Delete Requirement?\n\nAre you sure you want to delete: ${req.code} — ${req.title}?\n\nThis action may remove requirement links from related features and tasks.`)) {
      deleteReqMutation.mutate(req._id);
    }
  };

  const handleFeatureToggle = (featureId) => {
    if (linkedFeatures.includes(featureId)) {
      setLinkedFeatures(linkedFeatures.filter(id => id !== featureId));
    } else {
      setLinkedFeatures([...linkedFeatures, featureId]);
    }
  };

  if (isReqLoading) return <LoadingSpinner text="Loading SRS Requirements..." />;

  const requirements = reqData?.requirements || [];
  const chain = traceData?.chain || [];

  const functionalReqs = requirements.filter(r => r.type === 'FUNCTIONAL' || !r.type);
  const nonFunctionalReqs = requirements.filter(r => r.type === 'NON_FUNCTIONAL');
  const implementedCount = requirements.filter(r => r.status === 'IMPLEMENTED' || r.status === 'COMPLETED').length;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Software Requirements (SRS)</h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Define, organize, and track the functional and non-functional requirements of your project.
            </p>
          </div>
        </div>

        {!facultyMode && (
          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-md transition-all flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Requirement</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total Requirements</p>
          <p className="text-2xl font-bold text-slate-800">{requirements.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Functional</p>
          <p className="text-2xl font-bold text-blue-600">{functionalReqs.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Non-Functional</p>
          <p className="text-2xl font-bold text-indigo-600">{nonFunctionalReqs.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Implemented</p>
          <p className="text-2xl font-bold text-emerald-600">{implementedCount}</p>
        </div>
      </div>

      <div className="flex border-b border-slate-200 space-x-8">
        <button
          onClick={() => setActiveTab('LIST')}
          className={`pb-3 font-semibold text-sm flex items-center space-x-2 border-b-2 transition-colors ${
            activeTab === 'LIST'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Requirements List</span>
        </button>

        <button
          onClick={() => setActiveTab('TRACEABILITY')}
          className={`pb-3 font-semibold text-sm flex items-center space-x-2 border-b-2 transition-colors ${
            activeTab === 'TRACEABILITY'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <GitCommit className="w-4 h-4" />
          <span>Traceability Matrix</span>
        </button>
      </div>

      {activeTab === 'LIST' && (
        <div className="space-y-6">
          {requirements.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-10 flex flex-col items-center justify-center text-center">
              <ClipboardList className="w-12 h-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-bold text-slate-800">No Requirements Created Yet</h3>
              <p className="text-sm text-slate-500 mt-2 max-w-sm mb-6">
                Start documenting your project's functional and non-functional requirements.
              </p>
              <button
                onClick={() => { resetForm(); setIsModalOpen(true); }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-md transition-all flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Your First Requirement</span>
              </button>
            </div>
          ) : (
            <>
              {functionalReqs.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="p-4 border-b border-slate-100 font-bold text-slate-800 flex items-center justify-between">
                    <span>Functional Requirements ({functionalReqs.length})</span>
                  </div>
                  <div className="divide-y divide-slate-200">
                    {functionalReqs.map(renderRequirementCard)}
                  </div>
                </div>
              )}

              {nonFunctionalReqs.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="p-4 border-b border-slate-100 font-bold text-slate-800 flex items-center justify-between">
                    <span>Non-Functional Requirements ({nonFunctionalReqs.length})</span>
                  </div>
                  <div className="divide-y divide-slate-200">
                    {nonFunctionalReqs.map(renderRequirementCard)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'TRACEABILITY' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Requirement</th>
                  <th className="px-6 py-4">Features</th>
                  <th className="px-6 py-4">Tasks</th>
                  <th className="px-6 py-4">Bugs</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {chain.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-slate-400 italic">No traceability data available.</td>
                  </tr>
                ) : (
                  chain.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-mono text-xs font-bold text-blue-700">{row.requirement.code}</div>
                        <div className="font-semibold text-slate-900 mt-0.5">{row.requirement.title}</div>
                      </td>
                      <td className="px-6 py-4">
                        {row.features.map(f => (
                          <div key={f._id} className="text-xs font-medium text-slate-700">{f.title}</div>
                        ))}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-slate-700">{row.tasks.length}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-slate-700">{row.bugs.length}</span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={row.requirement.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">
                {editingReqId ? 'EDIT REQUIREMENT' : 'CREATE REQUIREMENT'}
              </h3>
              <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Requirement Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. User Authentication"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Requirement Type *</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
                >
                  <option value="FUNCTIONAL">Functional</option>
                  <option value="NON_FUNCTIONAL">Non-Functional</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Description *</label>
                <textarea
                  rows="3"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="The system shall allow users to securely authenticate..."
                  className="w-full p-3 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Priority *</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="PLANNED">Planned</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="IMPLEMENTED">Implemented</option>
                    <option value="ON_HOLD">On Hold</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-2">Related Features</label>
                <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-1">
                  {features.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-2">No features found in project.</p>
                  ) : (
                    features.map(f => (
                      <label key={f._id} className="flex items-center space-x-2 text-xs p-1 hover:bg-slate-50 cursor-pointer rounded">
                        <input
                          type="checkbox"
                          checked={linkedFeatures.includes(f._id)}
                          onChange={() => handleFeatureToggle(f._id)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="truncate">{f.title}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); resetForm(); }}
                  className="px-4 py-2 text-slate-600 text-xs font-medium hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createReqMutation.isPending || updateReqMutation.isPending}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm"
                >
                  {createReqMutation.isPending || updateReqMutation.isPending ? 'Saving...' : editingReqId ? 'Save Changes' : 'Create Requirement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  function renderRequirementCard(r) {
    return (
      <div key={r._id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col md:flex-row justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="flex items-start space-x-3">
            <span className="font-mono text-xs font-bold text-blue-700 mt-0.5">{r.code}</span>
            <div>
              <h4 className="font-bold text-slate-900 text-sm mb-1">{r.title}</h4>
              {r.description && <p className="text-xs text-slate-500 whitespace-pre-wrap">{r.description}</p>}
            </div>
          </div>
          <div className="flex items-center space-x-3 text-[10px] font-bold uppercase mt-2">
            <span className="text-slate-500">Type: {r.type === 'FUNCTIONAL' ? 'Functional' : 'Non-Functional'}</span>
            <span className={`px-1.5 py-0.5 rounded ${
              r.priority === 'CRITICAL' ? 'bg-rose-100 text-rose-700' :
              r.priority === 'HIGH' ? 'bg-amber-100 text-amber-700' :
              'bg-slate-100 text-slate-700'
            }`}>
              Priority: {r.priority}
            </span>
            <span className="text-slate-500 flex items-center">
              Status: <StatusBadge status={r.status} className="ml-1" />
            </span>
          </div>
          {r.linkedFeatures && r.linkedFeatures.length > 0 && (
            <div className="mt-3 bg-slate-50 p-2 rounded border border-slate-100 text-xs inline-block">
              <span className="font-bold text-slate-700 mb-1 block text-[10px] uppercase">Linked Features:</span>
              <div className="flex flex-col space-y-1">
                {r.linkedFeatures.map(fId => {
                  const feature = features.find(feat => feat._id === fId);
                  return feature ? <span key={fId} className="text-indigo-700 font-medium">{feature.title}</span> : null;
                })}
              </div>
            </div>
          )}
        </div>

        {!facultyMode && (
          <div className="flex items-start space-x-2 shrink-0">
            <button
              onClick={() => handleEdit(r)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
            >
              Edit
            </button>
            <button
              onClick={() => handleDelete(r)}
              className="px-3 py-1.5 text-xs font-semibold text-rose-600 bg-white border border-rose-200 rounded hover:bg-rose-50 transition-colors"
              disabled={deleteReqMutation.isPending}
            >
              Delete
            </button>
          </div>
        )}
      </div>
    );
  }
};

export default StudentRequirementsPage;
