import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import API from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Sparkles, Plus, X, Trash2, Edit2, Calendar, CheckSquare, Square, CheckCircle } from 'lucide-react';

export const StudentFeaturesPage = ({ facultyMode = false, specificProjectId = null }) => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFeatureId, setEditingFeatureId] = useState(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [startDate, setStartDate] = useState('');
  const [targetEndDate, setTargetEndDate] = useState('');
  const [formError, setFormError] = useState('');

  // Checklist Modal State
  const [checklistModal, setChecklistModal] = useState({
    isOpen: false,
    featureId: null,
    mode: 'ADD', // 'ADD' or 'EDIT'
    itemIndex: null,
    name: '',
    isCompleted: false
  });

  // Fetch Features
  const { data: featuresData, isLoading } = useQuery({
    queryKey: ['agileFeatures', specificProjectId],
    queryFn: async () => {
      const url = specificProjectId ? `/agile/features?projectId=${specificProjectId}` : '/agile/features';
      const res = await API.get(url);
      return res.data;
    },
  });

  // Create Mutation
  const createFeatureMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await API.post('/agile/features', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['agileFeatures']);
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err) => setFormError(err.response?.data?.message || 'Failed to create feature.'),
  });

  // Update Mutation
  const updateFeatureMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const res = await API.put(`/agile/features/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['agileFeatures']);
      setIsModalOpen(false);
      setChecklistModal({ ...checklistModal, isOpen: false });
      resetForm();
    },
    onError: (err) => setFormError(err.response?.data?.message || 'Failed to update feature.'),
  });

  // Delete Mutation
  const deleteFeatureMutation = useMutation({
    mutationFn: async (id) => {
      const res = await API.delete(`/agile/features/${id}`);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries(['agileFeatures']),
    onError: (err) => alert(err.response?.data?.message || 'Failed to delete feature.'),
  });

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority('MEDIUM');
    setStartDate('');
    setTargetEndDate('');
    setFormError('');
    setEditingFeatureId(null);
  };

  const handleSaveFeature = (e) => {
    e.preventDefault();
    setFormError('');
    if (!title.trim()) return setFormError('Feature name is required.');
    
    const payload = { title, description, priority, startDate, targetEndDate };

    if (editingFeatureId) updateFeatureMutation.mutate({ id: editingFeatureId, payload });
    else createFeatureMutation.mutate(payload);
  };

  const handleEdit = (feature) => {
    setEditingFeatureId(feature._id);
    setTitle(feature.title);
    setDescription(feature.description || '');
    setPriority(feature.priority || 'MEDIUM');
    setStartDate(feature.startDate ? new Date(feature.startDate).toISOString().split('T')[0] : '');
    setTargetEndDate(feature.targetEndDate ? new Date(feature.targetEndDate).toISOString().split('T')[0] : '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleDelete = (id, title) => {
    if (window.confirm(`Are you sure you want to delete feature: "${title}"?\n\nThis cannot be undone. You cannot delete a feature if it has linked tasks.`)) {
      deleteFeatureMutation.mutate(id);
    }
  };

  const handleSaveChecklistItem = (e) => {
    e.preventDefault();
    const feature = featuresData.features.find(f => f._id === checklistModal.featureId);
    if (!feature) return;

    let updatedChecklist = [...(feature.checklistItems || [])];

    if (checklistModal.mode === 'ADD') {
      updatedChecklist.push({
        name: checklistModal.name,
        isCompleted: checklistModal.isCompleted
      });
    } else {
      updatedChecklist[checklistModal.itemIndex] = {
        name: checklistModal.name,
        isCompleted: checklistModal.isCompleted
      };
    }

    updateFeatureMutation.mutate({ id: feature._id, payload: { checklistItems: updatedChecklist } });
  };

  const handleDeleteChecklistItem = (featureId, index, itemName) => {
    if (window.confirm(`Delete checklist item "${itemName}"?`)) {
      const feature = featuresData.features.find(f => f._id === featureId);
      let updatedChecklist = [...(feature.checklistItems || [])];
      updatedChecklist.splice(index, 1);
      updateFeatureMutation.mutate({ id: feature._id, payload: { checklistItems: updatedChecklist } });
    }
  };

  const handleToggleChecklistItem = (featureId, index) => {
    const feature = featuresData.features.find(f => f._id === featureId);
    let updatedChecklist = [...(feature.checklistItems || [])];
    updatedChecklist[index].isCompleted = !updatedChecklist[index].isCompleted;
    updateFeatureMutation.mutate({ id: feature._id, payload: { checklistItems: updatedChecklist } });
  };

  if (isLoading) return <LoadingSpinner text="Loading Features..." />;

  const features = featuresData?.features || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Project Features</h1>
            <p className="text-sm text-slate-500 mt-1">
              Define major capabilities and track completion using checklists.
            </p>
          </div>
        </div>

        {!facultyMode && (
          <button
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-semibold shadow-md transition-all flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create Feature</span>
          </button>
        )}
      </div>

      {/* Feature Cards Grid */}
      {features.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 shadow-sm text-center">
          <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-700">No Features Defined</h3>
          <p className="text-slate-500 text-sm mt-1 max-w-md mx-auto">
            Start by defining a major feature. Add checklist items to calculate progress automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {features.map((f) => {
            const isComplete = f.progress === 100 || (f.status === 'DONE' && (!f.checklistItems || f.checklistItems.length === 0));
            const isOverdue = !isComplete && f.targetEndDate && new Date(f.targetEndDate).setHours(23,59,59,999) < new Date().getTime();
            const isCompletedLate = isComplete && f.targetEndDate && f.updatedAt && new Date(f.targetEndDate).setHours(23,59,59,999) < new Date(f.updatedAt).getTime();
            
            let cardStyle = "bg-white border-slate-200 hover:shadow-md";
            if (isOverdue) cardStyle = "bg-red-50/50 border-red-300 shadow-sm shadow-red-100 hover:shadow-md hover:shadow-red-200";
            else if (isCompletedLate) cardStyle = "bg-pink-50/30 border-pink-300 shadow-sm shadow-pink-100 hover:shadow-md hover:shadow-pink-200";
            else if (isComplete) cardStyle = "bg-slate-50 border-emerald-200 shadow-sm opacity-90";

            return (
            <div key={f._id} className={`p-6 rounded-xl border transition-all group relative ${cardStyle}`}>
              {!facultyMode && (
                <div className="absolute top-4 right-4 hidden group-hover:flex items-center space-x-2 bg-white/90 p-1 rounded-lg">
                  <button onClick={() => handleEdit(f)} className="p-1.5 text-slate-400 hover:text-blue-600 rounded bg-slate-50 hover:bg-blue-50" title="Edit Feature Details">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(f._id, f.title)} className="p-1.5 text-slate-400 hover:text-rose-600 rounded bg-slate-50 hover:bg-rose-50" title="Delete Feature">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="flex justify-between items-start mb-4 pr-16">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    {isComplete && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                    {f.title}
                  </h3>
                  <div className="flex items-center space-x-2 mt-2">
                    <StatusBadge status={f.status} />
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      f.priority === 'HIGH' || f.priority === 'CRITICAL' ? 'bg-rose-100 text-rose-700' :
                      f.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {f.priority} Priority
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-3xl font-black ${isComplete ? 'text-emerald-500' : isOverdue ? 'text-rose-500' : isCompletedLate ? 'text-pink-500' : 'text-amber-500'}`}>
                    {f.progress}%
                  </span>
                </div>
              </div>

              <p className="text-sm text-slate-600 mb-4 line-clamp-2">{f.description || 'No description provided.'}</p>

              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-6 border border-slate-200">
                <div 
                  className={`h-full transition-all duration-500 ${isComplete ? 'bg-emerald-500' : isOverdue ? 'bg-rose-500' : isCompletedLate ? 'bg-pink-500' : 'bg-amber-500'}`}
                  style={{ width: `${f.progress}%` }}
                ></div>
              </div>

              {/* Checklist Items */}
              <div className="mb-6">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Checklist Items</h4>
                
                {(!f.checklistItems || f.checklistItems.length === 0) ? (
                  <div className="text-sm text-slate-400 italic">No checklist items added yet.</div>
                ) : (
                  <div className="space-y-2">
                    {f.checklistItems.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between group/item p-2 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-100 transition-colors">
                        <div 
                          className="flex items-center gap-3 cursor-pointer flex-1"
                          onClick={() => handleToggleChecklistItem(f._id, idx)}
                        >
                          {item.isCompleted ? (
                            <CheckSquare className="w-5 h-5 text-emerald-500" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-300 group-hover/item:text-slate-400" />
                          )}
                          <span className={`text-sm ${item.isCompleted ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                            {item.name}
                          </span>
                        </div>
                        {!facultyMode && (
                          <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                            <button 
                              onClick={() => setChecklistModal({ isOpen: true, featureId: f._id, mode: 'EDIT', itemIndex: idx, name: item.name, isCompleted: item.isCompleted })}
                              className="p-1.5 text-slate-400 hover:text-blue-600 rounded bg-white hover:bg-blue-50 shadow-sm border border-slate-200"
                              title="Edit Item"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => handleDeleteChecklistItem(f._id, idx, item.name)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded bg-white hover:bg-rose-50 shadow-sm border border-slate-200"
                              title="Delete Item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-sm font-semibold text-slate-600">
                    {f.completedItems} / {f.totalItems} Completed
                  </span>
                  {!facultyMode && (
                    <button 
                      onClick={() => setChecklistModal({ isOpen: true, featureId: f._id, mode: 'ADD', itemIndex: null, name: '', isCompleted: false })}
                      className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Checklist Item
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 mb-4">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center justify-between">
                  <p className="text-xs text-slate-500 uppercase font-bold">Timeline</p>
                  <div className="flex items-center space-x-1 text-sm font-medium text-slate-700">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>
                      {f.startDate ? new Date(f.startDate).toLocaleDateString() : 'TBD'} - 
                      {f.targetEndDate ? new Date(f.targetEndDate).toLocaleDateString() : 'TBD'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Creator Info */}
              <div className="flex items-center text-xs text-slate-400 pt-2">
                <span>Created by {f.createdBy?.name || 'System'}</span>
              </div>
            </div>
          )})}
        </div>
      )}

      {/* Feature Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full flex flex-col shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0">
              <h3 className="text-lg font-bold text-slate-800">{editingFeatureId ? 'Edit Feature' : 'Create Feature'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:bg-slate-100 p-1 rounded-md">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5">
              {formError && <div className="mb-4 p-3 bg-rose-50 text-rose-700 rounded-lg text-sm">{formError}</div>}
              
              <form id="feature-form" onSubmit={handleSaveFeature} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Feature Name *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. User Authentication"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Description</label>
                  <textarea
                    rows="3"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe this major functionality..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Start Date</label>
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Target End Date</label>
                    <input type="date" value={targetEndDate} onChange={(e) => setTargetEndDate(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500" />
                  </div>
                </div>
              </form>
            </div>

            <div className="p-5 border-t border-slate-100 shrink-0 flex items-center justify-end space-x-3 bg-slate-50 rounded-b-2xl">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 text-sm font-medium hover:bg-slate-200 rounded-lg transition-colors">
                Cancel
              </button>
              <button 
                type="submit" 
                form="feature-form"
                disabled={createFeatureMutation.isPending || updateFeatureMutation.isPending} 
                className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-semibold shadow-md transition-all"
              >
                {(createFeatureMutation.isPending || updateFeatureMutation.isPending) ? 'Saving...' : editingFeatureId ? 'Save Changes' : 'Create Feature'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checklist Item Modal */}
      {checklistModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full flex flex-col shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0">
              <h3 className="text-lg font-bold text-slate-800">
                {checklistModal.mode === 'ADD' ? 'Add Checklist Item' : 'Edit Checklist Item'}
              </h3>
              <button onClick={() => setChecklistModal({ ...checklistModal, isOpen: false })} className="text-slate-400 hover:bg-slate-100 p-1 rounded-md">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5">
              <form id="checklist-form" onSubmit={handleSaveChecklistItem} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Item Name *</label>
                  <input
                    type="text"
                    required
                    value={checklistModal.name}
                    onChange={(e) => setChecklistModal({ ...checklistModal, name: e.target.value })}
                    placeholder="e.g. Deadline Reminder"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <label className="flex items-center space-x-3 cursor-pointer p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <input 
                    type="checkbox" 
                    checked={checklistModal.isCompleted}
                    onChange={(e) => setChecklistModal({ ...checklistModal, isCompleted: e.target.checked })}
                    className="w-5 h-5 text-emerald-500 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <span className="text-sm font-semibold text-slate-700">Mark as Completed</span>
                </label>
              </form>
            </div>
            
            <div className="p-5 border-t border-slate-100 shrink-0 flex items-center justify-end space-x-3 bg-slate-50 rounded-b-2xl">
              <button onClick={() => setChecklistModal({ ...checklistModal, isOpen: false })} className="px-4 py-2 text-slate-600 text-sm font-medium hover:bg-slate-200 rounded-lg transition-colors">
                Cancel
              </button>
              <button 
                type="submit" 
                form="checklist-form"
                disabled={updateFeatureMutation.isPending} 
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-md transition-all"
              >
                {updateFeatureMutation.isPending ? 'Saving...' : checklistModal.mode === 'ADD' ? 'Add Item' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentFeaturesPage;
