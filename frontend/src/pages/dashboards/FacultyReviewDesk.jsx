import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import API from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import { Award, CheckCircle2, Users, FileText, Calendar, Clock, Lock, Unlock } from 'lucide-react';

export const FacultyReviewDesk = () => {
  const queryClient = useQueryClient();
  const [selectedReviewId, setSelectedReviewId] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [marksData, setMarksData] = useState({}); // { studentId: { marks, feedback } }

  // Fetch Reviews
  const { data: reviewsData, isLoading } = useQuery({
    queryKey: ['facultyReviews'],
    queryFn: async () => {
      const res = await API.get('/reviews/faculty/assigned');
      return res.data;
    }
  });

  // Fetch Faculty's Assigned Groups as Fallback
  const { data: groupsData } = useQuery({
    queryKey: ['facultyAssignedGroupsList'],
    queryFn: async () => {
      const res = await API.get('/faculty/groups');
      return res.data;
    }
  });

  const submitMarksMutation = useMutation({
    mutationFn: async ({ reviewId, payload }) => {
      const res = await API.post(`/reviews/${reviewId}/marks`, payload);
      return res.data;
    },
    onSuccess: (data) => {
      // Don't invalidate queries to preserve current selection
      alert(data?.message || 'Marks and feedback saved successfully!');
    },
    onError: (error) => {
      alert(error?.response?.data?.message || 'Failed to save marks. Please try again.');
    }
  });

  if (isLoading) return <LoadingSpinner text="Loading Assigned Reviews..." />;
  const reviews = reviewsData?.reviews || [];
  const allFacultyGroups = groupsData?.groups || [];

  const selectedReview = reviews.find(r => String(r._id) === String(selectedReviewId));
  const availableGroups = (selectedReview?.assignedGroups && selectedReview.assignedGroups.length > 0)
    ? selectedReview.assignedGroups
    : allFacultyGroups;

  const selectedGroup = availableGroups.find(g => String(g._id || g.id) === String(selectedGroupId));

  const handleMarksChange = (studentId, field, value) => {
    if (field === 'marks') {
      const num = Number(value);
      const max = selectedReview?.maxMarks || 20;
      if (value !== '' && (num < 0 || num > max)) return; // Block invalid marks
    }
    setMarksData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value
      }
    }));
  };

  const handleSave = (isDraft) => {
    if (!selectedReview || !selectedGroup) return;
    
    const max = selectedReview.maxMarks || 20;
    
    // Validate marks range
    for (const studentId of Object.keys(marksData)) {
      const m = Number(marksData[studentId]?.marks || 0);
      if (m < 0 || m > max) {
        alert(`Marks must be between 0 and ${max}!`);
        return;
      }
    }

    const studentMarks = Object.keys(marksData).map(studentId => ({
      studentId,
      marks: Number(marksData[studentId].marks || 0),
      feedback: marksData[studentId].feedback || ''
    }));

    if (studentMarks.length === 0) {
      alert('Please enter marks for at least one student.');
      return;
    }

    submitMarksMutation.mutate({
      reviewId: selectedReview._id,
      payload: {
        groupId: selectedGroup._id || selectedGroup.id,
        isDraft,
        studentMarks
      }
    });
  };

  const groupMembers = (selectedGroup?.members && selectedGroup.members.length > 0)
    ? selectedGroup.members
    : (selectedGroup?.leaderId ? [selectedGroup.leaderId] : []);

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)] gap-6">
      {/* LEFT SIDEBAR: MY REVIEWS */}
      <div className="w-full lg:w-1/3 bg-white rounded-xl border border-slate-200 flex flex-col shadow-sm">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-600" />
            My Assigned Reviews
          </h2>
          <span className="text-xs font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full">
            {reviews.length} Active
          </span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {reviews.length === 0 ? (
            <div className="text-center p-8 text-slate-500 text-sm">
              <Award className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              No reviews scheduled yet by Department Coordinator.
            </div>
          ) : (
            reviews.map(review => (
              <div 
                key={review._id} 
                onClick={() => { setSelectedReviewId(review._id); setSelectedGroupId(null); setMarksData({}); }}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedReviewId === review._id ? 'bg-indigo-50/70 border-indigo-300 shadow-xs' : 'bg-white border-slate-200 hover:border-indigo-200'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-slate-900 text-sm">{review.title}</h3>
                  <StatusBadge status={review.status} />
                </div>
                <div className="text-xs font-medium text-slate-500 flex items-center gap-3 my-2">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(review.reviewDate).toLocaleDateString()}</span>
                  <span className="font-semibold text-slate-700">Max Marks: {review.maxMarks}</span>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-3 pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider self-center mr-1">Select Group:</span>
                  {((review.assignedGroups && review.assignedGroups.length > 0) ? review.assignedGroups : allFacultyGroups).map(group => {
                    const gId = String(group._id || group.id);
                    const isSelected = String(selectedReviewId) === String(review._id) && String(selectedGroupId) === gId;
                    return (
                      <span 
                        key={gId} 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setSelectedReviewId(review._id); 
                          setSelectedGroupId(group._id || group.id); 
                          setMarksData({}); 
                        }}
                        className={`text-[11px] px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${
                          isSelected ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-indigo-100 hover:text-indigo-800'
                        }`}
                      >
                        <Users className="w-3.5 h-3.5"/> {group.name || group.title || group.code || group.projectKey || 'Group'}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT SIDE: EVALUATION FORM */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
        {!selectedReview ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
            <Award className="w-16 h-16 mb-4 text-slate-200" />
            <h3 className="text-xl font-bold text-slate-700">Select a Review</h3>
            <p className="mt-2 text-sm max-w-sm">Choose an assigned review stage from the left panel to begin evaluating student groups.</p>
          </div>
        ) : !selectedGroup ? (
           <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
             <Users className="w-16 h-16 mb-4 text-slate-200" />
             <h3 className="text-xl font-bold text-slate-700">Select a Group</h3>
             <p className="mt-2 text-sm max-w-sm">Select a specific group badge under <b>"{selectedReview.title}"</b> to record evaluation marks.</p>
           </div>
        ) : (
          <>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/80 rounded-t-xl">
              <div>
                <h2 className="text-xl font-bold text-slate-800">{selectedReview.title}</h2>
                <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
                  Evaluating Group: <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">{selectedGroup.name || selectedGroup.title || selectedGroup.code || 'Selected Group'}</span>
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-slate-800">{selectedReview.maxMarks}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Max Marks</div>
              </div>
            </div>

            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              {groupMembers.map((student, i) => {
                 const studentId = student._id || student.id || `student-${i}`;
                 const studentName = student.name || `Student ${i + 1}`;
                 const enrollNo = student.enrollmentNumber || student.enrollmentNo || `24IT00${i + 1}`;

                 return (
                  <div key={studentId} className="border border-slate-200 rounded-xl p-5 bg-white shadow-2xs relative overflow-hidden space-y-3">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-600"></div>
                    <div className="flex justify-between items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-700 shrink-0">
                        {studentName.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-slate-900">{studentName}</h4>
                          <span className="text-xs font-mono font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{enrollNo}</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-3">
                          <div className="col-span-1">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Marks (Max: {selectedReview.maxMarks})</label>
                            <input 
                              type="number" min="0" max={selectedReview.maxMarks}
                              value={marksData[studentId]?.marks || ''}
                              onChange={(e) => handleMarksChange(studentId, 'marks', e.target.value)}
                              className="w-full border border-slate-300 rounded-lg p-2 text-center font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-sm"
                              placeholder={`0 - ${selectedReview.maxMarks}`}
                            />
                          </div>
                          <div className="col-span-3">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Evaluation Feedback</label>
                            <textarea 
                              rows="2"
                              value={marksData[studentId]?.feedback || ''}
                              onChange={(e) => handleMarksChange(studentId, 'feedback', e.target.value)}
                              className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 resize-none"
                              placeholder="Enter feedback for student work..."
                            ></textarea>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                 )
              })}
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-white rounded-b-xl">
              <button 
                onClick={() => handleSave(true)}
                disabled={submitMarksMutation.isPending}
                className="px-6 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200 transition text-xs disabled:opacity-50"
              >
                Save as Draft
              </button>
              <button 
                onClick={() => handleSave(false)}
                disabled={submitMarksMutation.isPending}
                className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg shadow-sm hover:bg-indigo-700 transition flex items-center gap-2 text-xs disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4"/> Submit Evaluation
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FacultyReviewDesk;
