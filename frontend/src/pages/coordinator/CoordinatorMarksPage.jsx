import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import API from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Award, Plus, Calendar, CheckCircle2, X, Shield, Edit2, Trash2, GraduationCap, Download } from 'lucide-react';

export const CoordinatorMarksPage = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('RUBRICS'); // 'RUBRICS' | 'MARKS'

  // Modals
  const [isCriteriaModal, setIsCriteriaModal] = useState(false);
  const [editingCriteria, setEditingCriteria] = useState(null);
  const [isMarkModal, setIsMarkModal] = useState(false);
  const [editingMarkRecord, setEditingMarkRecord] = useState(null);

  // Criteria Form State
  const [cName, setCName] = useState('');
  const [cWeight, setCWeight] = useState(25);
  const [cDesc, setCDesc] = useState('');

  // Mark Entry Form State
  const [mProject, setMProject] = useState('');
  const [mStudent, setMStudent] = useState('');
  const [mStage, setMStage] = useState('REVIEW_1');
  const [mScores, setMScores] = useState({});
  const [mFeedback, setMFeedback] = useState('');

  // Fetch Criteria
  const { data: criteriaData, isLoading: isCriteriaLoading } = useQuery({
    queryKey: ['coordEvalCriteria'],
    queryFn: async () => {
      const res = await API.get('/evaluation/criteria');
      return res.data;
    },
  });

  // Fetch Proposals / Projects
  const { data: proposalsData } = useQuery({
    queryKey: ['coordProposalsList'],
    queryFn: async () => {
      const res = await API.get('/proposals/assigned');
      return res.data;
    },
  });

  // Fetch Student Marks
  const { data: marksData, isLoading: isMarksLoading } = useQuery({
    queryKey: ['coordStudentMarks'],
    queryFn: async () => {
      const res = await API.get('/evaluation/marks');
      return res.data;
    },
  });

  // Save/Update Criteria Mutation
  const saveCriteriaMutation = useMutation({
    mutationFn: async (payload) => {
      if (editingCriteria) {
        const res = await API.put(`/evaluation/criteria/${editingCriteria._id}`, payload);
        return res.data;
      }
      const res = await API.post('/evaluation/criteria', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['coordEvalCriteria']);
      setIsCriteriaModal(false);
      setEditingCriteria(null);
      setCName('');
      setCDesc('');
    },
  });

  // Delete Criteria Mutation
  const deleteCriteriaMutation = useMutation({
    mutationFn: async (id) => {
      const res = await API.delete(`/evaluation/criteria/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['coordEvalCriteria']);
    },
  });

  // Submit / Edit Student Marks Mutation
  const submitMarksMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await API.post('/evaluation/marks', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['coordStudentMarks']);
      setIsMarkModal(false);
      setEditingMarkRecord(null);
      setMProject('');
      setMStudent('');
      setMScores({});
      setMFeedback('');
    },
  });

  if (isCriteriaLoading) return <LoadingSpinner text="Loading Marks & Evaluation Engine..." />;

  const criteria = criteriaData?.criteria || [];
  const proposals = proposalsData?.proposals || [];
  const markRecords = marksData?.markRecords || [];
  const totalWeightage = criteria.reduce((sum, c) => sum + (c.weightagePercentage || 0), 0);

  const downloadCSVReport = () => {
    if (!markRecords || markRecords.length === 0) {
      alert("No mark records available to download.");
      return;
    }
    const headers = ["Student Name", "Enrollment No", "Project Title", "Group Code", "Review Stage", "Total Score (100)", "Grade", "Evaluator"];
    const rows = markRecords.map(m => [
      `"${m.studentId?.name || 'Student'}"`,
      `"${m.studentId?.enrollmentNumber || 'N/A'}"`,
      `"${m.projectId?.title || 'N/A'}"`,
      `"${m.projectId?.groupId?.code || m.projectId?.groupId?.name || 'N/A'}"`,
      `"${m.reviewStage || 'N/A'}"`,
      m.totalMarksObtained || 0,
      `"${m.grade || 'N/A'}"`,
      `"${m.evaluatorId?.name || 'Faculty'}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Department_Marks_Evaluation_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openCriteriaModal = (c = null) => {
    if (c) {
      setEditingCriteria(c);
      setCName(c.name || '');
      setCWeight(c.weightagePercentage || 25);
      setCDesc(c.description || '');
    } else {
      setEditingCriteria(null);
      setCName('');
      setCWeight(25);
      setCDesc('');
    }
    setIsCriteriaModal(true);
  };

  const openMarkModal = (rec = null) => {
    if (rec) {
      setEditingMarkRecord(rec);
      setMProject(rec.projectId?._id || rec.projectId || '');
      setMStudent(rec.studentId?._id || rec.studentId || '');
      setMStage(rec.reviewStage || 'REVIEW_1');
      setMFeedback(rec.feedback || '');

      const initialScores = {};
      (rec.criteriaScores || []).forEach((cs) => {
        initialScores[cs.criteriaId] = cs.marksObtained;
      });
      setMScores(initialScores);
    } else {
      setEditingMarkRecord(null);
      setMProject(proposals[0]?._id || '');
      setMStudent(proposals[0]?.groupId?.leaderId?._id || '');
      setMStage('REVIEW_1');
      setMFeedback('');
      setMScores({});
    }
    setIsMarkModal(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Marks & Evaluation</h1>
              <StatusBadge status="ACTIVE" customLabel={`Total Weightage: ${totalWeightage}%`} />
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Configure department rubrics, lock/publish grades, download reports, and override student marks.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={downloadCSVReport}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center space-x-1.5"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Download Report (CSV)</span>
          </button>

          <button
            onClick={() => openCriteriaModal(null)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Rubric</span>
          </button>
          <button
            onClick={() => openMarkModal(null)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center space-x-1.5"
          >
            <GraduationCap className="w-4 h-4" />
            <span>Enter / Edit Marks</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white px-4 rounded-xl shadow-sm">
        <button
          onClick={() => setActiveTab('RUBRICS')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'RUBRICS'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Evaluation Rubrics ({criteria.length})
        </button>
        <button
          onClick={() => setActiveTab('MARKS')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'MARKS'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Student Marks & Grade Records ({markRecords.length})
        </button>
      </div>

      {/* TAB 1: EVALUATION RUBRICS */}
      {activeTab === 'RUBRICS' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Department Rubrics</h3>
            <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full ${totalWeightage === 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
              Total Weightage: {totalWeightage}% {totalWeightage === 100 ? '(Valid)' : '(Target: 100%)'}
            </span>
          </div>

          {criteria.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500 text-sm">
              No evaluation rubrics configured yet. Click "Add Rubric" to define evaluation criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {criteria.map((c) => (
                <div key={c._id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 relative group">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-slate-900 text-sm">{c.name}</h4>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-mono font-bold text-xs rounded">
                        {c.weightagePercentage}%
                      </span>
                      <button onClick={() => openCriteriaModal(c)} className="p-1.5 text-slate-400 hover:text-blue-600 rounded bg-white border border-slate-200">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete rubric "${c.name}"?`)) deleteCriteriaMutation.mutate(c._id);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded bg-white border border-slate-200"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{c.description || 'No description provided.'}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: STUDENT MARKS */}
      {activeTab === 'MARKS' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Student Evaluation Records</h3>
            <div className="flex items-center gap-2">
              <button onClick={downloadCSVReport} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1">
                <Download className="w-3.5 h-3.5 text-emerald-400" /> Export CSV
              </button>
              <button onClick={() => openMarkModal(null)} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold">
                + Enter / Edit Marks
              </button>
            </div>
          </div>

          {isMarksLoading ? (
            <LoadingSpinner text="Fetching student mark records..." />
          ) : markRecords.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500 text-sm">
              No student marks recorded yet. Click "Enter / Edit Marks" to evaluate group members.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Group & Project</th>
                    <th className="px-4 py-3">Stage</th>
                    <th className="px-4 py-3">Score</th>
                    <th className="px-4 py-3">Grade</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {markRecords.map((m) => (
                    <tr key={m._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {m.studentId?.name || 'Student'}
                        {m.studentId?.enrollmentNumber && (
                          <span className="block text-xs font-mono text-blue-600 font-normal">
                            ({m.studentId.enrollmentNumber})
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs font-medium">
                        <span className="font-bold text-slate-800">{m.projectId?.title || 'Project'}</span>
                        {m.projectId?.groupId && (
                          <span className="block font-mono text-slate-500">
                            {m.projectId.groupId.code} - {m.projectId.groupId.name}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-slate-100 font-mono font-bold text-xs text-slate-700 rounded">
                          {m.reviewStage}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-900 text-sm">
                        {m.totalMarksObtained} / 100
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                          m.grade === 'A+' || m.grade === 'A'
                            ? 'bg-emerald-100 text-emerald-800'
                            : m.grade === 'B+' || m.grade === 'B'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {m.grade || 'A'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => openMarkModal(m)}
                          className="px-3 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit Marks
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Criteria Modal */}
      {isCriteriaModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">{editingCriteria ? 'Edit Rubric Criteria' : 'Add Evaluation Rubric Criteria'}</h3>
              <button onClick={() => setIsCriteriaModal(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (cName) saveCriteriaMutation.mutate({ name: cName, weightagePercentage: Number(cWeight), description: cDesc });
              }}
              className="space-y-4 mt-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Criteria Name *</label>
                <input
                  type="text"
                  required
                  value={cName}
                  onChange={(e) => setCName(e.target.value)}
                  placeholder="e.g. System Architecture & Code"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Weightage Percentage (0-100) *</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={cWeight}
                  onChange={(e) => setCWeight(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Description</label>
                <textarea
                  rows="3"
                  value={cDesc}
                  onChange={(e) => setCDesc(e.target.value)}
                  placeholder="Rubric grading guidelines..."
                  className="w-full p-3 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsCriteriaModal(false)} className="px-4 py-2 text-slate-600 text-xs font-medium">Cancel</button>
                <button type="submit" disabled={saveCriteriaMutation.isPending} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm">
                  {saveCriteriaMutation.isPending ? 'Saving...' : 'Save Rubric'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enter / Edit Marks Modal */}
      {isMarkModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">{editingMarkRecord ? 'Edit Student Marks' : 'Enter Student Marks'}</h3>
              <button onClick={() => setIsMarkModal(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const criteriaScores = criteria.map((c) => ({
                  criteriaId: c._id,
                  criteriaName: c.name,
                  weightagePercentage: c.weightagePercentage,
                  marksObtained: Number(mScores[c._id] || 0),
                  maxMarks: 100,
                }));

                submitMarksMutation.mutate({
                  projectId: mProject,
                  studentId: mStudent,
                  reviewStage: mStage,
                  criteriaScores,
                  feedback: mFeedback,
                });
              }}
              className="space-y-4 mt-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Select Project / Group *</label>
                <select
                  value={mProject}
                  onChange={(e) => setMProject(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
                  required
                >
                  {proposals.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.projectKey} - {p.title} ({p.groupId?.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Review Stage</label>
                <select
                  value={mStage}
                  onChange={(e) => setMStage(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
                >
                  <option value="REVIEW_1">Review 1 (Proposal)</option>
                  <option value="REVIEW_2">Review 2 (Mid-Term)</option>
                  <option value="REVIEW_3">Review 3 (Testing)</option>
                  <option value="FINAL_VIVA">Final Viva</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-2">Criteria Marks Breakdown (0-100 per criteria)</label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {criteria.map((c) => (
                    <div key={c._id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                      <div>
                        <span className="font-bold text-xs text-slate-800">{c.name}</span>
                        <span className="block text-[10px] text-slate-500 font-mono">Weight: {c.weightagePercentage}%</span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        required
                        value={mScores[c._id] || ''}
                        onChange={(e) => setMScores({ ...mScores, [c._id]: e.target.value })}
                        placeholder="Marks"
                        className="w-20 px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono font-bold text-right"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Feedback & Notes</label>
                <textarea
                  rows="2"
                  value={mFeedback}
                  onChange={(e) => setMFeedback(e.target.value)}
                  placeholder="Feedback for the student..."
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                ></textarea>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsCriteriaModal(false)} className="px-4 py-2 text-slate-600 text-xs font-medium">Cancel</button>
                <button type="submit" disabled={submitMarksMutation.isPending} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm">
                  {submitMarksMutation.isPending ? 'Saving...' : 'Save Student Marks'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoordinatorMarksPage;
