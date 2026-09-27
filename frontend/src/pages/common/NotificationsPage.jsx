import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import API from '../../services/api';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Bell, CheckCheck, Info, CheckCircle2, AlertCircle, Flag, Award, Package, Github, GitBranch, Filter } from 'lucide-react';

const TYPE_ICONS = {
  TASK: <CheckCircle2 className="w-4 h-4 text-blue-600" />,
  BUG: <AlertCircle className="w-4 h-4 text-rose-600" />,
  MILESTONE: <Flag className="w-4 h-4 text-amber-600" />,
  REVIEW: <Award className="w-4 h-4 text-purple-600" />,
  RELEASE: <Package className="w-4 h-4 text-emerald-600" />,
  GITHUB: <Github className="w-4 h-4 text-slate-800" />,
  DEFAULT: <Info className="w-4 h-4 text-indigo-600" />
};

export const NotificationsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filterType, setFilterType] = useState('ALL');
  const [readFilter, setReadFilter] = useState('ALL'); // ALL, UNREAD, READ

  const { data, isLoading } = useQuery({
    queryKey: ['userNotifications'],
    queryFn: async () => {
      const res = await API.get('/platform/notifications');
      return res.data;
    },
  });

  const readAllMutation = useMutation({
    mutationFn: async () => {
      const res = await API.put('/platform/notifications/read-all');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['userNotifications']);
    },
  });

  const actionMutation = useMutation({
    mutationFn: async ({ id, action }) => {
      const res = await API.put(`/platform/notifications/${id}/action`, { action });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['userNotifications']);
    },
  });

  if (isLoading) return <LoadingSpinner text="Loading Notifications..." />;

  const allNotifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  // Simulate rich notifications if array is empty (for demo purpose based on user request)
  const notifications = allNotifications.length > 0 ? allNotifications : [
    { _id: '1', type: 'TASK', title: 'New Task Assigned', message: 'You have been assigned: "Create Login API"\n👤 Assigned to: Rahul\n📅 Due: 05 Sep\n🕐 05:00 PM', isRead: false, createdAt: new Date().toISOString() },
    { _id: '2', type: 'MILESTONE', title: 'Deadline Tomorrow', message: '📋 Database Design\n👤 Responsible: Aarav\n⏰ Due tomorrow at 05:00 PM', isRead: false, createdAt: new Date(Date.now() - 3600000).toISOString() },
    { _id: '3', type: 'REVIEW', title: 'Upcoming Review', message: '🎤 Mid-Term Review\n👥 Group A\n📅 15 September 2026\n🕐 10:00 AM', isRead: true, createdAt: new Date(Date.now() - 86400000).toISOString() }
  ];

  // Filtering
  const filtered = notifications.filter(n => {
    if (filterType !== 'ALL' && n.type !== filterType) return false;
    if (readFilter === 'UNREAD' && n.isRead) return false;
    if (readFilter === 'READ' && !n.isRead) return false;
    return true;
  });

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6 flex-col md:flex-row pb-12">
      
      {/* LEFT CONTENT */}
      <div className="flex-1 flex flex-col space-y-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Bell className="w-6 h-6 text-indigo-600" /> Notifications
            </h1>
            <p className="text-sm text-slate-500 mt-1">Stay updated with your project activities.</p>
          </div>
          <div className="flex items-center gap-4">
            {unreadCount > 0 && <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">🔵 {unreadCount} Unread</span>}
            <button
              onClick={() => readAllMutation.mutate()}
              className="px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-sm font-semibold transition flex items-center gap-2"
            >
              <CheckCheck className="w-4 h-4" /> Mark All as Read
            </button>
          </div>
        </div>

        <div className="flex bg-white rounded-xl border border-slate-200 shadow-sm p-2 gap-2">
          {['ALL', 'UNREAD', 'READ'].map(f => (
            <button 
              key={f} onClick={() => setReadFilter(f)}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${readFilter === f ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Bell className="w-12 h-12 mx-auto mb-4 text-slate-200" />
              <h3 className="text-lg font-bold">No Notifications</h3>
              <p className="text-sm mt-1">You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map((n) => (
                <div key={n._id} className={`p-6 transition-colors flex items-start space-x-4 ${n.isRead ? 'bg-white' : 'bg-indigo-50/30'}`}>
                  <div className="mt-1 relative">
                    {!n.isRead && <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-indigo-600 rounded-full border-2 border-white"></div>}
                    <div className="p-3 bg-slate-100 rounded-xl">
                      {TYPE_ICONS[n.type] || TYPE_ICONS.DEFAULT}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-slate-900 text-base cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => n.linkUrl && navigate(n.linkUrl)}>
                        {n.title}
                      </h4>
                      <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap ml-4">
                        {new Date(n.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true })}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 whitespace-pre-line leading-relaxed mb-3">{n.message}</p>
                    
                    <div className="flex flex-wrap gap-2 items-center">
                      {n.linkUrl && (
                        <button 
                          onClick={() => navigate(n.linkUrl)} 
                          className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                        >
                          Go to Page →
                        </button>
                      )}

                      {n.actionType === 'GITHUB_REPO_CHANGE' && n.actionStatus === 'PENDING' && (
                        <>
                          <button onClick={() => actionMutation.mutate({ id: n._id, action: 'APPROVE' })} className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-colors">Approve Change</button>
                          <button onClick={() => actionMutation.mutate({ id: n._id, action: 'REJECT' })} className="px-3 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-bold transition-colors">Reject</button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SIDEBAR: FILTERS */}
      <div className="w-full md:w-64 flex flex-col space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4" /> Categories
          </h3>
          <div className="space-y-1">
            {[
              { id: 'ALL', label: 'All Categories', icon: null },
              { id: 'TASK', label: 'Tasks', icon: <CheckCircle2 className="w-4 h-4"/> },
              { id: 'FEATURE', label: 'Features', icon: <GitBranch className="w-4 h-4"/> },
              { id: 'BUG', label: 'Bugs', icon: <AlertCircle className="w-4 h-4"/> },
              { id: 'MILESTONE', label: 'Milestones', icon: <Flag className="w-4 h-4"/> },
              { id: 'REVIEW', label: 'Reviews', icon: <Award className="w-4 h-4"/> },
              { id: 'RELEASE', label: 'Releases', icon: <Package className="w-4 h-4"/> },
              { id: 'GITHUB', label: 'GitHub Activity', icon: <Github className="w-4 h-4"/> }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setFilterType(cat.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition ${
                  filterType === cat.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};

export default NotificationsPage;
