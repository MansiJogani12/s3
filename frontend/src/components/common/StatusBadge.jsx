import React from 'react';

const STATUS_CONFIG = {
  // Project / Proposal Statuses
  DRAFT: { label: 'Draft', bg: 'bg-slate-100 text-slate-700 border-slate-300' },
  SUBMITTED: { label: 'Submitted', bg: 'bg-sky-50 text-sky-700 border-sky-300' },
  UNDER_REVIEW: { label: 'Under Review', bg: 'bg-sky-50 text-sky-700 border-sky-300' },
  REVISION_REQUIRED: { label: 'Revision Required', bg: 'bg-amber-50 text-amber-700 border-amber-300' },
  APPROVED: { label: 'Approved', bg: 'bg-emerald-50 text-emerald-700 border-emerald-300' },
  REJECTED: { label: 'Rejected', bg: 'bg-rose-50 text-rose-700 border-rose-300' },
  IN_DEVELOPMENT: { label: 'In Development', bg: 'bg-blue-50 text-blue-700 border-blue-300' },
  COMPLETED: { label: 'Completed', bg: 'bg-emerald-600 text-white border-emerald-600' },
  
  // Sprint Statuses
  PLANNED: { label: 'Planned', bg: 'bg-slate-100 text-slate-700 border-slate-300' },
  ACTIVE: { label: 'Active', bg: 'bg-blue-100 text-blue-800 border-blue-300' },
  CANCELLED: { label: 'Cancelled', bg: 'bg-rose-100 text-rose-800 border-rose-300' },

  // Bug Statuses
  OPEN: { label: 'Open', bg: 'bg-rose-50 text-rose-700 border-rose-300' },
  IN_PROGRESS: { label: 'In Progress', bg: 'bg-amber-50 text-amber-700 border-amber-300' },
  FIXED: { label: 'Fixed', bg: 'bg-sky-50 text-sky-700 border-sky-300' },
  RETEST: { label: 'Retest', bg: 'bg-purple-50 text-purple-700 border-purple-300' },
  CLOSED: { label: 'Closed', bg: 'bg-emerald-50 text-emerald-700 border-emerald-300' },

  // Risk Levels
  LOW: { label: 'Low Risk', bg: 'bg-emerald-50 text-emerald-700 border-emerald-300' },
  MEDIUM: { label: 'Medium Risk', bg: 'bg-amber-50 text-amber-700 border-amber-300' },
  HIGH: { label: 'High Risk', bg: 'bg-rose-50 text-rose-700 border-rose-300' },
};

export const StatusBadge = ({ status, customLabel = null, className = '' }) => {
  const normalizedStatus = String(status || '').toUpperCase();
  const config = STATUS_CONFIG[normalizedStatus] || {
    label: status || 'Unknown',
    bg: 'bg-slate-100 text-slate-700 border-slate-300',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${className}`}
    >
      {customLabel || config.label}
    </span>
  );
};

export default StatusBadge;
