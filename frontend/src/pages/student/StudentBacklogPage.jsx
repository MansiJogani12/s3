import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import API from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Layers, Plus, CheckSquare, Sparkles, X, User } from 'lucide-react';

export const StudentBacklogPage = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [editingStoryId, setEditingStoryId] = useState(null);
  const [persona, setPersona] = useState('As a student');
  const [action, setAction] = useState('');
  const [benefit, setBenefit] = useState('');
  const [storyPoints, setStoryPoints] = useState(3);
  const [priority, setPriority] = useState('MEDIUM');

  // Fetch Stories
  const { data, isLoading } = useQuery({
    queryKey: ['userStories'],
    queryFn: async () => {
      const res = await API.get('/agile/stories');
      return res.data;
    },
  });

  // Create Story Mutation
  const createStoryMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await API.post('/agile/stories', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['userStories']);
      setIsModalOpen(false);
      resetForm();
    },
  });

  // Update Story Mutation
  const updateStoryMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await API.put(`/agile/stories/${editingStoryId}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['userStories']);
      setIsModalOpen(false);
      resetForm();
    },
  });

  // Delete Story Mutation
  const deleteStoryMutation = useMutation({
    mutationFn: async (id) => {
      const res = await API.delete(`/agile/stories/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['userStories']);
    },
    onError: (err) => {
      alert(err.response?.data?.message || 'Failed to delete user story');
    }
  });

  const resetForm = () => {
    setPersona('As a student');
    setAction('');
    setBenefit('');
    setStoryPoints(3);
    setPriority('MEDIUM');
    setEditingStoryId(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!action.trim() || !benefit.trim()) return;
    if (editingStoryId) {
      updateStoryMutation.mutate({ persona, action, benefit, storyPoints, priority });
    } else {
      createStoryMutation.mutate({ persona, action, benefit, storyPoints, priority });
    }
  };

  const handleEdit = (story) => {
    setEditingStoryId(story._id);
    setPersona(story.persona);
    setAction(story.action);
    setBenefit(story.benefit);
    setStoryPoints(story.storyPoints);
    setPriority(story.priority);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this user story? This action cannot be undone.')) {
      deleteStoryMutation.mutate(id);
    }
  };

  if (isLoading) return <LoadingSpinner text="Loading Product Backlog..." />;

  const stories = data?.userStories || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Product Backlog & User Stories</h1>
              <StatusBadge status="ACTIVE" customLabel="Agile Requirements" />
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Define user stories (As a / I want to / So that), assign story points (1, 2, 3, 5, 8, 13), and prioritize backlog items.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-md transition-all flex items-center space-x-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add User Story</span>
        </button>
      </div>

      {/* User Stories Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 font-bold text-slate-800 flex items-center justify-between">
          <span>Backlog Items ({stories.length})</span>
        </div>

        {stories.length === 0 ? (
          <p className="text-xs text-slate-400 italic text-center py-8">No user stories in backlog.</p>
        ) : (
          <div className="divide-y divide-slate-200">
            {stories.map((s) => (
              <div key={s._id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-xs font-bold text-indigo-700">{s.code}</span>
                    <span className="text-sm font-bold text-slate-800">
                      "{s.persona}, {s.action}, {s.benefit}"
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full font-mono text-xs font-bold">
                    {s.storyPoints} Story Points
                  </span>
                  <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold font-mono">
                    {s.status}
                  </span>
                  <button
                    onClick={() => handleEdit(s)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Edit User Story"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                  </button>
                  <button
                    onClick={() => handleDelete(s._id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete User Story"
                    disabled={deleteStoryMutation.isPending}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">
                {editingStoryId ? 'Edit User Story' : 'Create User Story'}
              </h3>
              <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Persona (As a...)
                </label>
                <input
                  type="text"
                  required
                  value={persona}
                  onChange={(e) => setPersona(e.target.value)}
                  placeholder="As a student / guide / coordinator..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Action (I want to...)
                </label>
                <input
                  type="text"
                  required
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  placeholder="I want to view my sprint progress..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Benefit (So that...)
                </label>
                <input
                  type="text"
                  required
                  value={benefit}
                  onChange={(e) => setBenefit(e.target.value)}
                  placeholder="So that I can deliver tasks on deadline..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Story Points
                  </label>
                  <select
                    value={storyPoints}
                    onChange={(e) => setStoryPoints(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value={1}>1 Point</option>
                    <option value={2}>2 Points</option>
                    <option value={3}>3 Points</option>
                    <option value={5}>5 Points</option>
                    <option value={8}>8 Points</option>
                    <option value={13}>13 Points</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); resetForm(); }}
                  className="px-4 py-2 text-slate-600 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createStoryMutation.isPending || updateStoryMutation.isPending}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm"
                >
                  {createStoryMutation.isPending || updateStoryMutation.isPending ? 'Saving...' : editingStoryId ? 'Save Changes' : 'Save User Story'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentBacklogPage;
