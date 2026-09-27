import React from 'react';
import StatusBadge from './StatusBadge';
import EmptyState from './EmptyState';
import { Layers, Sparkles } from 'lucide-react';

export const PlaceholderPage = ({
  title,
  subtitle,
  icon: Icon = Layers,
  milestone = 'Upcoming Milestone',
}) => {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                {title}
              </h1>
              <StatusBadge status="PLANNED" customLabel={milestone} />
            </div>
            <p className="text-sm text-slate-500 mt-1">
              {subtitle || `Management module for ${title.toLowerCase()}.`}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-xs">
        <EmptyState
          icon={Icon}
          title={`${title} Module`}
          description={`The ${title} interface is scheduled to be unlocked in ${milestone}. All navigation and authentication routing for this module is fully configured.`}
          action={
            <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-mono">
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
              Route active & authenticated
            </div>
          }
        />
      </div>
    </div>
  );
};

export default PlaceholderPage;
