import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import API from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import { Package, Plus, Calendar, CheckCircle2, GitPullRequest, Search, FileText, ChevronRight, X, ExternalLink } from 'lucide-react';

export const StudentReleasesPage = ({ facultyMode = false, specificProjectId = null }) => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRelease, setSelectedRelease] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    version: '', title: '', releaseDate: '', description: '', status: 'DRAFT', githubReleaseUrl: ''
  });

  const { data: releasesData, isLoading } = useQuery({
    queryKey: ['projectReleases', specificProjectId],
    queryFn: async () => {
      const url = specificProjectId ? `/releases?projectId=${specificProjectId}` : '/releases';
      const res = await API.get(url); 
      return res.data;
    }
  });

  const createReleaseMutation = useMutation({
    mutationFn: async (payload) => {
      if (payload._id) {
         const res = await API.put(`/releases/${payload._id}`, payload);
         return res.data;
      } else {
         const res = await API.post('/releases', payload);
         return res.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['projectReleases']);
      setIsModalOpen(false);
      setFormData({ version: '', title: '', releaseDate: '', description: '', status: 'DRAFT', githubReleaseUrl: '' });
    }
  });

  // Since we don't have a real project ID yet, we fall back to empty array
  // Wait, if backend fails due to bad ID, let's just show empty state or mock data
  const releases = releasesData?.releases || [];
  
  const totalReleases = releases.length;
  const releasedCount = releases.filter(r => r.status === 'RELEASED').length;
  const draftCount = releases.filter(r => r.status === 'DRAFT').length;

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6">
      {/* MAIN CONTENT: TIMELINE */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200 flex flex-col shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Package className="w-7 h-7 text-indigo-600" /> Releases
            </h1>
            <p className="text-slate-500 text-sm mt-1">Track important versions and project deliverables.</p>
          </div>
          {!facultyMode && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Create Release
            </button>
          )}
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-3 gap-4 p-6 bg-slate-50 border-b border-slate-100">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600"><Package className="w-5 h-5"/></div>
            <div><p className="text-[10px] font-bold text-slate-500 uppercase">Total</p><p className="text-xl font-black text-slate-800">{totalReleases}</p></div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600"><CheckCircle2 className="w-5 h-5"/></div>
            <div><p className="text-[10px] font-bold text-slate-500 uppercase">Released</p><p className="text-xl font-black text-slate-800">{releasedCount}</p></div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600"><FileText className="w-5 h-5"/></div>
            <div><p className="text-[10px] font-bold text-slate-500 uppercase">Drafts</p><p className="text-xl font-black text-slate-800">{draftCount}</p></div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          {releases.length === 0 ? (
            <div className="text-center p-12">
              <Package className="w-16 h-16 text-slate-200 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-700">No Releases Yet</h3>
              <p className="text-slate-500 text-sm mt-1">Create your first project release to start tracking versions.</p>
            </div>
          ) : (
            <div className="relative border-l-2 border-slate-200 ml-4 space-y-12">
              {releases.map(release => (
                <div key={release._id} className="relative pl-8">
                  <div className={`absolute -left-[11px] top-1 w-5 h-5 rounded-full border-4 border-white ${release.status === 'RELEASED' ? 'bg-emerald-500' : release.status === 'SCHEDULED' ? 'bg-amber-400' : 'bg-slate-300'}`}></div>
                  
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                      <Package className="w-5 h-5 text-indigo-500" />
                      {release.version}
                    </h2>
                    <StatusBadge status={release.status} />
                  </div>
                  
                  <h3 className="text-lg font-bold text-slate-700 mb-2">{release.title}</h3>
                  <div className="text-sm text-slate-500 flex items-center gap-2 mb-4">
                    <Calendar className="w-4 h-4" /> {release.status === 'RELEASED' ? 'Released on' : 'Scheduled for'} {new Date(release.releaseDate).toLocaleDateString()}
                  </div>
                  
                  <p className="text-slate-600 text-sm mb-4 max-w-2xl">{release.description || release.releaseNotes || 'No description provided.'}</p>
                  
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setSelectedRelease(release)}
                      className="text-indigo-600 font-semibold text-sm hover:underline flex items-center gap-1"
                    >
                      View Details <ChevronRight className="w-4 h-4" />
                    </button>
                    {!facultyMode && (
                      <button 
                        onClick={() => {
                          setFormData({
                            _id: release._id,
                            version: release.version || release.tag || '',
                            title: release.title || '',
                            releaseDate: release.releaseDate ? new Date(release.releaseDate).toISOString().split('T')[0] : '',
                            description: release.description || release.releaseNotes || '',
                            status: release.status || 'DRAFT',
                            githubReleaseUrl: release.githubReleaseUrl || ''
                          });
                          setIsModalOpen(true);
                        }}
                        className="text-slate-500 hover:text-indigo-600 font-semibold text-sm flex items-center gap-1 transition"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SIDEBAR: DETAILS DRAWER (Static for now, simulates drawer) */}
      {selectedRelease && (
        <div className="w-1/3 bg-white rounded-xl border border-slate-200 flex flex-col shadow-sm">
          <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50 rounded-t-xl">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-5 h-5 text-indigo-600" />
                <h2 className="text-xl font-black text-slate-800">{selectedRelease.version}</h2>
              </div>
              <h3 className="font-bold text-slate-700">{selectedRelease.title}</h3>
            </div>
            <button onClick={() => setSelectedRelease(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
          </div>
          
          <div className="p-6 overflow-y-auto space-y-6">
            <div className="flex items-center gap-3">
              <StatusBadge status={selectedRelease.status} />
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm text-slate-700 space-y-2">
              <div className="flex justify-between">
                <span className="font-bold text-slate-500">Release Date</span>
                <span className="font-semibold">{new Date(selectedRelease.releaseDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-slate-500">Related Milestone</span>
                <span className="font-semibold text-indigo-600">{selectedRelease.milestoneId?.title || 'None'}</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                <GitPullRequest className="w-4 h-4" /> Included Features
              </h4>
              <div className="space-y-2">
                {selectedRelease.includedFeatures?.length > 0 ? selectedRelease.includedFeatures.map(f => (
                  <div key={f._id} className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {f.title}
                  </div>
                )) : (
                  <div className="text-sm text-slate-500 italic">No specific features tagged.</div>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Release Notes
              </h4>
              <p className="text-sm text-slate-600 whitespace-pre-line bg-slate-50 p-4 rounded-lg border border-slate-100">
                {selectedRelease.description || 'No release notes provided.'}
              </p>
            </div>

            {selectedRelease.githubReleaseUrl && (
              <a 
                href={selectedRelease.githubReleaseUrl} target="_blank" rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white p-3 rounded-lg font-bold text-sm transition"
              >
                <ExternalLink className="w-4 h-4" /> View on GitHub
              </a>
            )}
          </div>
        </div>
      )}

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" /> Create Release
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Version *</label>
                  <input 
                    type="text" required placeholder="e.g. v1.0"
                    value={formData.version} onChange={e => setFormData({...formData, version: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg p-2.5 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Release Date *</label>
                  <input 
                    type="date" required
                    value={formData.releaseDate} onChange={e => setFormData({...formData, releaseDate: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg p-2.5 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Release Title *</label>
                <input 
                  type="text" required placeholder="e.g. Final Project Release"
                  value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg p-2.5 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description / Release Notes</label>
                <textarea 
                  rows="3" placeholder="What's new in this release?"
                  value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg p-2.5 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status</label>
                  <select 
                    value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg p-2.5 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="DRAFT">Draft (⚪)</option>
                    <option value="SCHEDULED">Scheduled (🟡)</option>
                    <option value="RELEASED">Released (🟢)</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-xl">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-200 rounded-lg">Cancel</button>
              <button 
                type="button" onClick={() => createReleaseMutation.mutate(formData)}
                disabled={createReleaseMutation.isPending || !formData.version || !formData.title || !formData.releaseDate}
                className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-sm hover:bg-indigo-700 disabled:opacity-50"
              >
                Create Release
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentReleasesPage;
