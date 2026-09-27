import React from 'react';
import { useQuery } from '@tanstack/react-query';
import API from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { ShieldCheck, Clock, User, Terminal } from 'lucide-react';

export const AdminAuditLogsPage = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['adminAuditLogs'],
    queryFn: async () => {
      const res = await API.get('/platform/audit-logs');
      return res.data;
    },
  });

  if (isLoading) return <LoadingSpinner text="Loading System Audit Logs..." />;

  const logs = data?.logs || [];

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">System Audit Trail & Security Logs</h1>
          <p className="text-sm text-slate-500 mt-1">Traceable log of all user authentication, group creations, proposals, and grade submissions.</p>
        </div>
        <StatusBadge status="ACTIVE" customLabel="Security Enforcement" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden divide-y divide-slate-200">
        {logs.map((log) => (
          <div key={log._id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center space-x-3">
                <span className="px-2 py-0.5 bg-slate-900 text-white font-mono text-[10px] font-bold rounded">
                  {log.action}
                </span>
                <span className="font-semibold text-slate-900 text-sm">{log.userId?.name || 'System User'} ({log.userId?.role})</span>
              </div>
              <p className="text-xs text-slate-500 font-mono">
                IP: {log.ipAddress || '127.0.0.1'} • Target: {log.targetEntity} ({log.targetId})
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">{new Date(log.createdAt).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminAuditLogsPage;
