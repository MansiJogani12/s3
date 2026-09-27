import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import API from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import { 
  Award, 
  Plus, 
  Calendar, 
  Clock, 
  Users, 
  FileText, 
  CheckCircle2, 
  X,
  Lock,
  Unlock,
  Shield,
  Edit2,
  Trash2,
  Image,
  Paperclip
} from 'lucide-react';

export const CoordinatorReviewsPage = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    type: 'Proposal Review',
    department: 'Computer Engineering',
    reviewDate: '',
    startTime: '',
    endTime: '',
    maxMarks: 20,
    status: 'DRAFT',
    marksVisibility: 'HIDDEN',
    attachmentUrl: ''
  });

  const { data: reviewsData, isLoading } = useQuery({
    queryKey: ['adminReviews'],
    queryFn: async () => {
      const res = await API.get('/reviews');
      return res.data;
    }
  });

  const saveReviewMutation = useMutation({
    mutationFn: async (payload) => {
      if (editingReview) {
        const res = await API.put(`/reviews/${editingReview._id}`, payload);
        return res.data;
      }
      const res = await API.post('/reviews', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminReviews']);
      queryClient.invalidateQueries(['calendar-events']);
      setIsModalOpen(false);
      setEditingReview(null);
      resetForm();
    }
  });

  const deleteReviewMutation = useMutation({
    mutationFn: async (id) => {
      const res = await API.delete(`/reviews/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminReviews']);
      queryClient.invalidateQueries(['calendar-events']);
    }
  });

  const resetForm = () => {
    setFormData({
      title: '', type: 'Proposal Review', department: 'Computer Engineering',
      reviewDate: '', startTime: '', endTime: '', maxMarks: 20, status: 'DRAFT', marksVisibility: 'HIDDEN', attachmentUrl: ''
    });
  };

  const openCreateModal = () => {
    setEditingReview(null);
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (review) => {
    setEditingReview(review);
    setFormData({
      title: review.title || '',
      type: review.type || 'Proposal Review',
      department: review.department || 'Computer Engineering',
      reviewDate: review.reviewDate ? new Date(review.reviewDate).toISOString().split('T')[0] : '',
      startTime: review.startTime || '',
      endTime: review.endTime || '',
      maxMarks: review.maxMarks || 20,
      status: review.status || 'DRAFT',
      marksVisibility: review.marksVisibility || 'HIDDEN',
      attachmentUrl: review.attachmentUrl || ''
    });
    setIsModalOpen(true);
  };

  if (isLoading) return <LoadingSpinner text="Loading Reviews Overview..." />;
  const reviews = reviewsData?.reviews || [];

  // Derived Stats
  const totalReviews = reviews.length;
  const completedReviews = reviews.filter(r => r.status === 'COMPLETED').length;
  const upcomingReviews = reviews.filter(r => r.status === 'PUBLISHED').length;
  const draftReviews = reviews.filter(r => r.status === 'DRAFT').length;

  const handleSubmit = (e) => {
    e.preventDefault();
    saveReviewMutation.mutate(formData);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Award className="w-7 h-7 text-indigo-600" />
            Reviews Overview
          </h1>
          <p className="text-slate-500 text-sm mt-1">Manage project review schedules, faculty evaluations and student feedback.</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Create Review
        </button>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600"><FileText className="w-5 h-5"/></div>
          <div><p className="text-xs font-bold text-slate-500 uppercase">Total</p><p className="text-xl font-black text-slate-800">{totalReviews}</p></div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600"><CheckCircle2 className="w-5 h-5"/></div>
          <div><p className="text-xs font-bold text-slate-500 uppercase">Completed</p><p className="text-xl font-black text-slate-800">{completedReviews}</p></div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600"><Clock className="w-5 h-5"/></div>
          <div><p className="text-xs font-bold text-slate-500 uppercase">Upcoming</p><p className="text-xl font-black text-slate-800">{upcomingReviews}</p></div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600"><Lock className="w-5 h-5"/></div>
          <div><p className="text-xs font-bold text-slate-500 uppercase">Drafts</p><p className="text-xl font-black text-slate-800">{draftReviews}</p></div>
        </div>
      </div>

      {/* REVIEW SCHEDULE */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-4 uppercase tracking-wider">Review Schedule</h2>
        
        {reviews.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
            <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-700">No Reviews Scheduled</h3>
            <p className="text-slate-500 text-sm mt-1">Click Create Review to schedule the first academic review.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map(review => (
              <div key={review._id} className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col md:flex-row justify-between gap-4 shadow-sm hover:shadow-md transition">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-indigo-500" />
                      {review.title}
                    </h3>
                    <StatusBadge status={review.status} />
                    {review.marksVisibility === 'VISIBLE' ? (
                       <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 uppercase"><Unlock className="w-3 h-3"/> Marks Visible</span>
                    ) : (
                       <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 uppercase"><Lock className="w-3 h-3"/> Marks Hidden</span>
                    )}
                    {review.attachmentUrl && (
                      <a href={review.attachmentUrl} target="_blank" rel="noreferrer" className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-semibold rounded border border-blue-200 hover:underline">
                        <Paperclip className="w-3 h-3 mr-1" /> Attached Photo/Doc
                      </a>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 text-sm text-slate-600">
                    <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-slate-400" /> {new Date(review.reviewDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                    <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-slate-400" /> {review.startTime || '10:00 AM'} - {review.endTime || '04:00 PM'}</div>
                    <div className="flex items-center gap-2"><Users className="w-4 h-4 text-slate-400" /> Groups: {review.assignedGroups?.length || 0}</div>
                    <div className="flex items-center gap-2 font-medium"><Shield className="w-4 h-4 text-slate-400" /> Max Marks: {review.maxMarks}</div>
                  </div>

                  {review.attachmentUrl && (
                    <div className="mt-2 max-w-xs">
                      <img src={review.attachmentUrl} alt="Review Notice" className="h-20 object-cover rounded-lg border border-slate-200 shadow-xs" onError={(e) => e.target.style.display='none'} />
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-end gap-2 shrink-0">
                  <button 
                    onClick={() => openEditModal(review)}
                    className="p-2 text-slate-500 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 rounded-lg transition"
                    title="Edit Review"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => {
                      if (confirm(`Delete review "${review.title}"?`)) deleteReviewMutation.mutate(review._id);
                    }}
                    className="p-2 text-slate-500 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 rounded-lg transition"
                    title="Delete Review"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                {editingReview ? <Edit2 className="w-5 h-5 text-indigo-600" /> : <Plus className="w-5 h-5 text-indigo-600" />} 
                {editingReview ? 'Edit Review Schedule' : 'Create Review Schedule'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="createReviewForm" onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Review Type *</label>
                    <select 
                      required
                      value={formData.type}
                      onChange={e => setFormData({...formData, type: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg p-2.5 focus:outline-none focus:border-indigo-500"
                    >
                      <option>Proposal Review</option>
                      <option>SRS Review</option>
                      <option>Design Review</option>
                      <option>Development Review</option>
                      <option>Mid-Term Review</option>
                      <option>Testing Review</option>
                      <option>Final Report Review</option>
                      <option>Final Evaluation</option>
                    </select>
                  </div>
                  
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Review Title *</label>
                    <input 
                      type="text" required
                      value={formData.title}
                      onChange={e => setFormData({...formData, title: e.target.value})}
                      placeholder="e.g. Mid-Term Review 2026"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg p-2.5 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Review Date *</label>
                    <input 
                      type="date" required
                      value={formData.reviewDate}
                      onChange={e => setFormData({...formData, reviewDate: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg p-2.5 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Max Marks *</label>
                    <input 
                      type="number" required min="1" max="100"
                      value={formData.maxMarks}
                      onChange={e => setFormData({...formData, maxMarks: Number(e.target.value)})}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg p-2.5 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Start Time</label>
                    <input 
                      type="time" required
                      value={formData.startTime}
                      onChange={e => setFormData({...formData, startTime: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg p-2.5 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">End Time</label>
                    <input 
                      type="time" required
                      value={formData.endTime}
                      onChange={e => setFormData({...formData, endTime: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg p-2.5 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                      <Image className="w-3.5 h-3.5 text-blue-600" /> Notice Photo / Document URL
                    </label>
                    <input 
                      type="text"
                      value={formData.attachmentUrl}
                      onChange={e => setFormData({...formData, attachmentUrl: e.target.value})}
                      placeholder="https://example.com/notice-photo.jpg"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-mono rounded-lg p-2.5 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Marks Visibility</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer flex-1">
                        <input type="radio" name="visibility" value="HIDDEN" checked={formData.marksVisibility === 'HIDDEN'} onChange={() => setFormData({...formData, marksVisibility: 'HIDDEN'})} />
                        <Lock className="w-4 h-4 text-slate-500" /> <span className="text-sm font-semibold">Hidden from Students</span>
                      </label>
                      <label className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg cursor-pointer flex-1">
                        <input type="radio" name="visibility" value="VISIBLE" checked={formData.marksVisibility === 'VISIBLE'} onChange={() => setFormData({...formData, marksVisibility: 'VISIBLE'})} />
                        <Unlock className="w-4 h-4 text-emerald-600" /> <span className="text-sm font-semibold text-emerald-700">Visible to Students</span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Initial Status</label>
                    <select 
                      value={formData.status}
                      onChange={e => setFormData({...formData, status: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg p-2.5 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="DRAFT">Save as Draft (⚪)</option>
                      <option value="PUBLISHED">Publish immediately (🟡)</option>
                    </select>
                  </div>
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-xl">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-200 rounded-lg transition">Cancel</button>
              <button 
                type="submit" form="createReviewForm"
                disabled={saveReviewMutation.isPending}
                className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-sm hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {saveReviewMutation.isPending ? 'Saving...' : editingReview ? 'Save Changes' : 'Create Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoordinatorReviewsPage;
