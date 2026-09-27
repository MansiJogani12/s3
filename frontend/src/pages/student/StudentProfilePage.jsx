import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import API from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { User, Lock, Tag, Save, Plus, X, Sparkles, CheckCircle2 } from 'lucide-react';

export const StudentProfilePage = () => {
  const queryClient = useQueryClient();
  const [skills, setSkills] = useState([]);
  const [interests, setInterests] = useState([]);
  const [bio, setBio] = useState('');
  
  const [newSkill, setNewSkill] = useState('');
  const [newInterest, setNewInterest] = useState('');
  const [newRole, setNewRole] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const [preferredRoles, setPreferredRoles] = useState([]);
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');

  const availableRoles = [
    'Frontend Developer',
    'Backend Developer',
    'UI/UX Designer',
    'Database Developer',
    'AI / ML Developer',
    'DevOps',
    'Testing / QA'
  ];

  const { data, isLoading } = useQuery({
    queryKey: ['studentProfile'],
    queryFn: async () => {
      const res = await API.get('/student/profile');
      return res.data;
    },
  });

  useEffect(() => {
    if (data?.profile) {
      setSkills(data.profile.skills || []);
      setInterests(data.profile.interests || []);
      setBio(data.profile.bio || '');
      setPreferredRoles(data.profile.preferredRoles || []);
      setGithubUrl(data.profile.githubUrl || '');
      setLinkedinUrl(data.profile.linkedinUrl || '');
      setPortfolioUrl(data.profile.portfolioUrl || '');
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await API.put('/student/profile', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['studentProfile']);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
  });

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleAddInterest = (e) => {
    e.preventDefault();
    if (newInterest.trim() && !interests.includes(newInterest.trim())) {
      setInterests([...interests, newInterest.trim()]);
      setNewInterest('');
    }
  };

  const handleRemoveInterest = (interestToRemove) => {
    setInterests(interests.filter((i) => i !== interestToRemove));
  };

  const handleRoleToggle = (role) => {
    if (preferredRoles.includes(role)) {
      setPreferredRoles(preferredRoles.filter(r => r !== role));
    } else {
      setPreferredRoles([...preferredRoles, role]);
    }
  };

  const handleAddRole = (e) => {
    e.preventDefault();
    if (newRole.trim() && !preferredRoles.includes(newRole.trim())) {
      setPreferredRoles([...preferredRoles, newRole.trim()]);
      setNewRole('');
    }
  };

  const handleSave = () => {
    updateMutation.mutate({ 
      skills, 
      interests, 
      bio, 
      preferredRoles,
      githubUrl,
      linkedinUrl,
      portfolioUrl
    });
  };

  if (isLoading) return <LoadingSpinner text="Loading profile..." />;

  const user = data?.user;
  const profile = data?.profile;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <User className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Student Profile</h1>
              <StatusBadge status="ACTIVE" customLabel="Student Self-Service" />
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Update your skills, interests, and developer bio to showcase to potential group members and guides.
            </p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-all shadow-md"
        >
          <Save className="w-4 h-4" />
          <span>{updateMutation.isPending ? 'Saving...' : 'Save Profile'}</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>Profile updated successfully!</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Read-Only Institutional Info Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-800 flex items-center">
              Institutional Details
            </h3>
            <span className="text-slate-400 flex items-center text-xs font-mono">
              <Lock className="w-3.5 h-3.5 mr-1" /> Locked
            </span>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Full Name
            </label>
            <div className="font-semibold text-slate-800">{user?.name}</div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Enrollment Number
            </label>
            <div className="font-mono text-blue-700 font-bold bg-blue-50 px-3 py-1.5 rounded-lg inline-block text-sm">
              {user?.enrollmentNumber}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Department
            </label>
            <div className="text-slate-700 font-medium">
              {profile?.departmentId?.name || 'Information Technology'} ({profile?.departmentId?.code || 'IT'})
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Semester
            </label>
            <div className="text-slate-700 font-mono font-medium">Semester {profile?.semester || 5}</div>
          </div>

          <div className="pt-2 text-[11px] text-slate-400 italic">
            Institutional fields can only be modified by system administrators.
          </div>
        </div>

        {/* Editable Skills, Interests & Bio */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
          <h3 className="text-base font-bold text-slate-800 pb-3 border-b border-slate-100 flex items-center">
            <Sparkles className="w-4 h-4 mr-2 text-blue-600" />
            Developer Profile & Bio
          </h3>

          {/* Bio Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              About Me / Bio
            </label>
            <textarea
              rows="3"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell project teammates and faculty guides about your developer background..."
              className="w-full p-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>

          {/* Technical Skills Tag Manager */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Technical Skills
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-200"
                >
                  <Tag className="w-3 h-3 mr-1.5" />
                  {skill}
                  <button
                    onClick={() => handleRemoveSkill(skill)}
                    className="ml-1.5 hover:text-rose-600 focus:outline-none"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
            <form onSubmit={handleAddSkill} className="flex gap-2">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Add skill (e.g. React, Node.js, Python)..."
                className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center"
              >
                <Plus className="w-4 h-4 mr-1" /> Add
              </button>
            </form>
          </div>

          {/* Project Interests Tag Manager */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Project Interests & Domains
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {interests.map((interest) => (
                <span
                  key={interest}
                  className="inline-flex items-center px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium border border-indigo-200"
                >
                  {interest}
                  <button
                    onClick={() => handleRemoveInterest(interest)}
                    className="ml-1.5 hover:text-rose-600 focus:outline-none"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
            <form onSubmit={handleAddInterest} className="flex gap-2">
              <input
                type="text"
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                placeholder="Add interest (e.g. AI, Cyber Security, Blockchain)..."
                className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center"
              >
                <Plus className="w-4 h-4 mr-1" /> Add
              </button>
            </form>
          </div>

          <div className="border-t border-slate-100 pt-6 mt-4">
            <h4 className="text-sm font-bold text-slate-800 mb-3">Preferred Project Role</h4>
            
            <div className="flex flex-wrap gap-2 mb-3">
              {preferredRoles.map((role) => (
                <span
                  key={role}
                  className="inline-flex items-center px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-medium border border-amber-200"
                >
                  {role}
                  <button
                    onClick={() => handleRoleToggle(role)}
                    className="ml-1.5 hover:text-rose-600 focus:outline-none"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              {availableRoles.map(role => (
                <label key={role} className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-slate-50 transition-colors border border-slate-100">
                  <input 
                    type="checkbox" 
                    checked={preferredRoles.includes(role)}
                    onChange={() => handleRoleToggle(role)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-slate-700">{role}</span>
                </label>
              ))}
            </div>

            <form onSubmit={handleAddRole} className="flex gap-2">
              <input
                type="text"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                placeholder="Add custom role (e.g. Game Developer)..."
                className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center"
              >
                <Plus className="w-4 h-4 mr-1" /> Add
              </button>
            </form>
          </div>

          <div className="border-t border-slate-100 pt-6 mt-4 space-y-4">
            <h4 className="text-sm font-bold text-slate-800 mb-3">Developer Links</h4>
            
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                GitHub Profile
              </label>
              <input
                type="url"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/yourusername"
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                LinkedIn Profile
              </label>
              <input
                type="url"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/yourusername"
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Portfolio Website
              </label>
              <input
                type="url"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                placeholder="https://yourportfolio.com"
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfilePage;
