import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { User, Mail, ShieldCheck, Building } from 'lucide-react';

export const FacultyProfilePage = () => {
  const { user } = useAuthStore();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-900 h-32 relative">
          <div className="absolute -bottom-12 left-8">
            <div className="w-24 h-24 bg-indigo-100 rounded-2xl border-4 border-white flex items-center justify-center shadow-md">
              <span className="text-4xl font-bold text-indigo-700">{user?.name?.charAt(0) || 'F'}</span>
            </div>
          </div>
        </div>
        <div className="pt-16 pb-8 px-8">
          <h1 className="text-2xl font-bold text-slate-800">{user?.name || 'Faculty Member'}</h1>
          <div className="flex items-center space-x-2 mt-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-semibold text-emerald-700 uppercase tracking-wide">{user?.role || 'FACULTY'}</span>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Institutional Details</h3>
              <div className="flex items-center space-x-3 text-slate-700">
                <Mail className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Institutional Email</p>
                  <p className="font-semibold">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 text-slate-700">
                <Building className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Department</p>
                  <p className="font-semibold">Computer Engineering (Default)</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Account Security</h3>
              <div className="flex items-center space-x-3 text-slate-700">
                <User className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Account Status</p>
                  <p className="font-semibold text-emerald-600">Active & Verified</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyProfilePage;
