import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import API from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Cpu, Save, Key, ShieldAlert } from 'lucide-react';

export const AdminAiSettingsPage = () => {
  const queryClient = useQueryClient();
  const [apiKey, setApiKey] = useState('');
  const [threshold, setThreshold] = useState('35');

  const { data, isLoading } = useQuery({
    queryKey: ['systemConfigs'],
    queryFn: async () => {
      const res = await API.get('/platform/settings');
      return res.data;
    },
  });

  const updateConfigMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await API.post('/platform/settings', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['systemConfigs']);
      alert('AI Configuration updated successfully!');
    },
  });

  if (isLoading) return <LoadingSpinner text="Loading AI Configuration..." />;

  const configs = data?.configs || [];

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">AI Recommendation & Similarity Settings</h1>
          <p className="text-sm text-slate-500 mt-1">Configure Google Gemini LLM API keys and historical plagiarism similarity thresholds.</p>
        </div>
        <StatusBadge status="ACTIVE" customLabel="AI Engine Config" />
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6 max-w-2xl">
        <div className="space-y-4">
          {configs.map((c) => (
            <div key={c._id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-mono text-xs font-bold text-slate-900">{c.key}</span>
                <span className="text-[11px] font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold">{c.value}</span>
              </div>
              <p className="text-xs text-slate-500">{c.description}</p>
            </div>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (apiKey) updateConfigMutation.mutate({ key: 'GEMINI_API_KEY', value: apiKey, description: 'Google Gemini Pro LLM Key' });
          }}
          className="space-y-4 pt-4 border-t border-slate-100"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Update Google Gemini API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <button
            type="submit"
            disabled={updateConfigMutation.isPending}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-md flex items-center space-x-1.5"
          >
            <Save className="w-4 h-4" />
            <span>Save AI Key Config</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminAiSettingsPage;
