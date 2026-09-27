import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { LogOut, User as UserIcon, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import API from '../../services/api';

const ROLE_BADGE_COLORS = {
  ADMIN: 'bg-purple-100 text-purple-800 border-purple-300',
  COORDINATOR: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  FACULTY: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  STUDENT: 'bg-blue-100 text-blue-800 border-blue-300',
};

export const Header = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await API.get('/platform/notifications');
      return res.data;
    },
    refetchInterval: 10000,
    enabled: !!user,
  });

  const unreadCount = notifData?.unreadCount || 0;

  const role = user?.role || 'STUDENT';
  const roleBadgeClass = ROLE_BADGE_COLORS[role] || 'bg-slate-100 text-slate-800 border-slate-300';

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-10 shadow-xs">
      <div className="flex items-center space-x-3">
        <h2 className="text-lg font-semibold text-slate-800">
          College SGP Portal
        </h2>
      </div>

      <div className="flex items-center space-x-4">
        {/* Role badge */}
        <span
          className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${roleBadgeClass}`}
        >
          {role}
        </span>

        {/* Notifications trigger */}
        <button
          type="button"
          onClick={() => navigate(`/${role.toLowerCase()}/notifications`)}
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg relative transition-colors cursor-pointer"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-pulse shadow-[0_0_4px_rgba(244,63,94,0.6)]"></span>
          )}
        </button>

        {/* User identity & logout */}
        <div className="flex items-center space-x-3 pl-3 border-l border-slate-200">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-semibold text-sm">
              {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-sm font-medium text-slate-800 leading-tight">
                {user?.name || 'User'}
              </div>
              <div className="text-[11px] text-slate-500 font-mono leading-tight">
                {user?.enrollmentNumber || user?.email || ''}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center text-xs font-medium text-slate-600 hover:text-rose-600 p-2 rounded-lg hover:bg-rose-50 transition-colors"
            title="Log out"
          >
            <LogOut className="w-4 h-4 mr-1" />
            <span className="hidden md:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
