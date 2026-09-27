import React from 'react';
import { CommonCalendarPage } from '../common/CommonCalendarPage';

export const StudentCalendarPage = ({ facultyMode = false, specificProjectId = null }) => {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Project Calendar</h1>
        <p className="text-slate-500 text-sm mt-1">Track all deadlines, milestones, reviews, and tasks in one centralized timeline.</p>
      </div>
      <CommonCalendarPage facultyMode={facultyMode} specificProjectId={specificProjectId} />
    </div>
  );
};

export default StudentCalendarPage;
