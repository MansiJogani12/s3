import React from 'react';
import { useQuery } from '@tanstack/react-query';
import API from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import { Award, Lock, MessageSquare, Unlock } from 'lucide-react';

export const StudentMarksPage = () => {
  const { data: marksData, isLoading: marksLoading } = useQuery({
    queryKey: ['studentMarks'],
    queryFn: async () => {
      const res = await API.get('/reviews/student/marks');
      return res.data;
    }
  });

  const { data: schedulesData, isLoading: schedulesLoading } = useQuery({
    queryKey: ['studentReviewSchedules'],
    queryFn: async () => {
      // Typically fetch this by group ID
      const res = await API.get('/reviews/student/schedules');
      return res.data;
    }
  });

  if (marksLoading || schedulesLoading) return <LoadingSpinner text="Fetching your academic records..." />;
  
  const visibleMarks = marksData?.marks || [];
  const scheduledReviews = schedulesData?.reviews || [];

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Award className="w-7 h-7 text-indigo-600" /> Reviews & Marks
          </h1>
          <p className="text-slate-500 text-sm mt-1">Track your academic progress and faculty feedback.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* COMPLETED REVIEWS (Visible & Hidden Marks) */}
        <div>
          <h2 className="text-lg font-bold text-slate-800 mb-4 uppercase tracking-wider">Completed Reviews</h2>
          <div className="space-y-4">
            {visibleMarks.length === 0 ? (
              <div className="p-8 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <p className="text-slate-500 font-medium">No review marks have been published yet.</p>
              </div>
            ) : (
              visibleMarks.map((mark, idx) => (
                <div key={idx} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-lg text-slate-800">{mark.reviewId?.title}</h3>
                    <StatusBadge status="COMPLETED" />
                  </div>
                  
                  <div className="text-sm text-slate-500 mb-4 flex items-center gap-2">
                    📅 {new Date(mark.reviewId?.reviewDate).toLocaleDateString()} &nbsp;•&nbsp; 👨‍🏫 {mark.facultyId?.name}
                  </div>

                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 mb-4">
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1"><MessageSquare className="w-3 h-3"/> Faculty Feedback</h4>
                    <p className="text-sm text-slate-700 italic">"{mark.feedback || 'No written feedback provided.'}"</p>
                  </div>

                  {mark.reviewId?.marksVisibility === 'VISIBLE' ? (
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <span className="text-emerald-600 font-bold flex items-center gap-1 text-sm"><Unlock className="w-4 h-4"/> Marks Published</span>
                      <span className="text-2xl font-black text-slate-800">{mark.marks}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 opacity-60">
                      <span className="text-slate-500 font-bold flex items-center gap-1 text-sm"><Lock className="w-4 h-4"/> Marks Not Published</span>
                      <span className="text-2xl font-black text-slate-400">---</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* UPCOMING REVIEW SCHEDULES */}
        <div>
          <h2 className="text-lg font-bold text-slate-800 mb-4 uppercase tracking-wider">Upcoming Reviews</h2>
          <div className="space-y-4">
            {scheduledReviews.length === 0 ? (
              <div className="p-8 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <p className="text-slate-500 font-medium">No upcoming reviews scheduled.</p>
              </div>
            ) : (
              scheduledReviews.map((schedule, idx) => (
                <div key={idx} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm opacity-90 border-l-4 border-l-amber-400">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-slate-800">{schedule.title}</h3>
                    <StatusBadge status="PUBLISHED" />
                  </div>
                  <p className="text-slate-600 text-sm mb-4">{schedule.description}</p>
                  <div className="grid grid-cols-2 gap-4 text-sm font-semibold text-slate-600 bg-slate-50 p-4 rounded-lg">
                    <div>📅 {new Date(schedule.reviewDate).toLocaleDateString()}</div>
                    <div>🕐 {schedule.startTime} - {schedule.endTime}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentMarksPage;
