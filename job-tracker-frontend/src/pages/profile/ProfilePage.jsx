import { useState, useEffect, useRef } from 'react';
import { profileApi } from '../../api/profileApi';
import { dashboardApi } from '../../api/dashboardApi';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

// ── Constants ─────────────────────────────────────────────────────
const TABS = [
  { id: 'info',      icon: '👤', label: 'Personal'    },
  { id: 'education', icon: '🎓', label: 'Education'   },
  { id: 'skills',    icon: '🛠',  label: 'Skills'      },
  { id: 'social',    icon: '🌐', label: 'Social Links' },
  { id: 'goals',     icon: '🎯', label: 'Career Goals' },
  { id: 'resume',    icon: '📄', label: 'Resume'       },
  { id: 'password',  icon: '🔒', label: 'Security'    },
  { id: 'xp',        icon: '🏆', label: 'XP & Level'  },
];

const LEVEL_ICONS = {
  'Beginner':          '🌱',
  'Learner':           '📚',
  'Problem Solver':    '⚙️',
  'Interview Ready':   '🎯',
  'Placement Warrior': '🏆',
};

const ACHIEVEMENTS_DEF = [
  { id: 'first_app',   icon: '🥉', label: 'First Application',    desc: 'Submit your first job application',  check: (d) => (d?.totalApplications || 0) >= 1  },
  { id: 'five_apps',   icon: '🥈', label: '5 Applications',       desc: 'Submit 5 job applications',          check: (d) => (d?.totalApplications || 0) >= 5  },
  { id: 'ten_apps',    icon: '🥇', label: '10 Applications',      desc: 'Submit 10 job applications',         check: (d) => (d?.totalApplications || 0) >= 10 },
  { id: 'xp_100',      icon: '⚡', label: '100 XP Earned',        desc: 'Earn 100 total XP',                  check: (d) => (d?.totalXp || 0) >= 100           },
  { id: 'xp_500',      icon: '💎', label: '500 XP Earned',        desc: 'Earn 500 total XP',                  check: (d) => (d?.totalXp || 0) >= 500           },
  { id: 'streak_5',    icon: '🔥', label: '5-Day Streak',         desc: 'Maintain a 5-day activity streak',   check: (d) => (d?.longestStreak || 0) >= 5       },
  { id: 'streak_30',   icon: '🏆', label: '30-Day Streak',        desc: 'Maintain a 30-day activity streak',  check: (d) => (d?.longestStreak || 0) >= 30      },
  { id: 'practice_10', icon: '🎤', label: '10 Questions Answered',desc: 'Answer 10 interview questions',      check: (d) => (d?.totalQuestionsAnswered || 0) >= 10 },
  { id: 'selected',    icon: '🎉', label: 'Got Selected!',        desc: 'Get selected in an interview',       check: (d) => (d?.selectedCount || 0) >= 1       },
  { id: 'coach',       icon: '💬', label: 'Career Coach User',    desc: 'Use the AI Career Coach',            check: () => false },
];

const SKILL_SUGGESTIONS = [
  'Java','Python','React','Spring Boot','Node.js',
  'MySQL','MongoDB','Docker','Git','AWS',
  'DSA','System Design','TypeScript','Kubernetes',
];

const JOB_TYPES = [
  'Full-time','Part-time','Internship','Remote','Hybrid','Contract'
];

// ── Avatar Component ──────────────────────────────────────────────
function ProfileAvatar({ hasPicture, name, pictureBust, size = 'lg',
                         onClick }) {
  const [imgError, setImgError] = useState(false);

  const sizeClass = size === 'lg'
    ? 'w-24 h-24 text-3xl'
    : size === 'xl'
      ? 'w-28 h-28 text-4xl'
      : 'w-16 h-16 text-xl';

  const initials = name
    ? name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()
    : 'U';

  useEffect(() => { setImgError(false); }, [pictureBust]);

  if (hasPicture && !imgError) {
    return (
      <img
        src={`http://localhost:8081/api/v1/profile/picture?t=${pictureBust}`}
        alt={name}
        onError={() => setImgError(true)}
        onClick={onClick}
        className={`${sizeClass} rounded-full object-cover
                    border-4 border-white shadow-lg
                    ${onClick ? 'cursor-pointer hover:opacity-90' : ''}`}
      />
    );
  }

  return (
    <div
      onClick={onClick}
      className={`${sizeClass} rounded-full bg-gradient-to-br
                  from-indigo-500 to-purple-600 flex items-center
                  justify-center text-white font-bold border-4
                  border-white shadow-lg
                  ${onClick ? 'cursor-pointer hover:opacity-90' : ''}`}>
      {initials}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────
export default function ProfilePage() {
  const { user, updateUser, refreshPicture, pictureBust } = useAuth();
  const fileRef = useRef();

  const [tab, setTab]           = useState('info');
  const [profile, setProfile]   = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [completion, setCompletion] = useState(null);
  const [review, setReview]     = useState(null);
  const [reviewing, setReviewing] = useState(false);
  const [skillInput, setSkillInput] = useState('');

  const [form, setForm] = useState({
    name: '', username: '', phone: '', location: '', bio: '',
    collegeName: '', degree: '', branch: '',
    graduationYear: '', cgpa: '',
    experienceYears: '', currentCompany: '', currentRole: '',
    skills: [],
    githubUrl: '', linkedinUrl: '', portfolioUrl: '',
    leetcodeUrl: '', codechefUrl: '', codeforcesUrl: '',
    targetRoleGoal: '', preferredCompanies: '',
    preferredLocation: '', expectedSalary: '', jobType: '',
  });

  const [pwForm, setPwForm] = useState({
    currentPassword: '', newPassword: '', confirmPassword: ''
  });

  useEffect(() => {
    Promise.all([
      fetchProfile(),
      fetchDashboard(),
    ]);
  }, []);

  const fetchProfile = async () => {
    try {
      const [profRes, compRes] = await Promise.all([
        profileApi.getProfile(),
        profileApi.getCompletion(),
      ]);
      const p = profRes.data.data;
      setProfile(p);
      setCompletion(compRes.data.data);
      setForm({
        name:              p.name              || '',
        username:          p.username          || '',
        phone:             p.phone             || '',
        location:          p.location          || '',
        bio:               p.bio               || '',
        collegeName:       p.collegeName       || '',
        degree:            p.degree            || '',
        branch:            p.branch            || '',
        graduationYear:    p.graduationYear    || '',
        cgpa:              p.cgpa              || '',
        experienceYears:   p.experienceYears   || '',
        currentCompany:    p.currentCompany    || '',
        currentRole:       p.currentRole       || '',
        skills:            p.skills            || [],
        githubUrl:         p.githubUrl         || '',
        linkedinUrl:       p.linkedinUrl       || '',
        portfolioUrl:      p.portfolioUrl      || '',
        leetcodeUrl:       p.leetcodeUrl       || '',
        codechefUrl:       p.codechefUrl       || '',
        codeforcesUrl:     p.codeforcesUrl     || '',
        targetRoleGoal:    p.targetRoleGoal    || '',
        preferredCompanies:p.preferredCompanies|| '',
        preferredLocation: p.preferredLocation || '',
        expectedSalary:    p.expectedSalary    || '',
        jobType:           p.jobType           || '',
      });
    } catch {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboard = async () => {
    try {
      const res = await dashboardApi.getDashboard();
      setDashboard(res.data.data);
    } catch {}
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        graduationYear:   form.graduationYear
          ? parseInt(form.graduationYear) : null,
        cgpa:             form.cgpa
          ? parseFloat(form.cgpa) : null,
        experienceYears:  form.experienceYears
          ? parseInt(form.experienceYears) : null,
      };
      const res = await profileApi.updateProfile(payload);
      setProfile(res.data.data);
      updateUser({ name: form.name });
      toast.success('Profile updated!');
      const compRes = await profileApi.getCompletion();
      setCompletion(compRes.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handlePicture = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await profileApi.uploadPicture(fd);
      setProfile(res.data.data);
      refreshPicture();
      toast.success('Profile picture updated!');
      const compRes = await profileApi.getCompletion();
      setCompletion(compRes.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setSaving(true);
    try {
      await profileApi.changePassword(pwForm);
      toast.success('Password changed!');
      setPwForm({ currentPassword:'', newPassword:'', confirmPassword:'' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const handleReview = async () => {
    setReviewing(true);
    try {
      const res = await profileApi.reviewProfile();
      setReview(res.data.data);
      toast.success('AI analysis complete!');
    } catch {
      toast.error('Review failed. Check your Groq API key.');
    } finally {
      setReviewing(false);
    }
  };

  const addSkill = (skill) => {
    const s = skill.trim();
    if (!s || form.skills.includes(s)) return;
    setForm({ ...form, skills: [...form.skills, s] });
    setSkillInput('');
  };

  const removeSkill = (skill) => {
    setForm({ ...form, skills: form.skills.filter(s => s !== skill) });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-500
                        border-t-transparent rounded-full animate-spin"/>
      </div>
    );
  }

  // Completion ring
  const pct = completion?.percentage || 0;
  const R   = 36;
  const circ = 2 * Math.PI * R;
  const dash = (pct / 100) * circ;

  const ringColor = pct >= 80 ? '#22c55e'
                  : pct >= 50 ? '#f59e0b'
                  : '#6366f1';

  // Achievements
  const earned   = ACHIEVEMENTS_DEF.filter(a => a.check(dashboard));
  const unearned = ACHIEVEMENTS_DEF.filter(a => !a.check(dashboard));

  return (
    <div className="space-y-6 max-w-5xl">

      {/* ── Profile Header Card ──────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200
                      overflow-hidden shadow-sm">

        {/* Banner */}
        <div className="h-24 bg-gradient-to-r from-indigo-600
                        via-purple-600 to-indigo-800"/>

        <div className="px-6 pb-5">
          <div className="flex items-end gap-5 -mt-12 mb-4
                          flex-wrap">

            {/* Avatar */}
            <div className="relative">
              <ProfileAvatar
                hasPicture={!!profile?.profilePictureUrl}
                name={user?.name}
                pictureBust={pictureBust}
                size="xl"
                onClick={() => fileRef.current.click()}
              />
              <button
                onClick={() => fileRef.current.click()}
                className="absolute bottom-1 right-1 w-7 h-7
                           bg-indigo-600 rounded-full text-white
                           text-xs flex items-center justify-center
                           shadow-md hover:bg-indigo-700 border-2
                           border-white transition-colors">
                ✏️
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handlePicture}
              />
            </div>

            {/* Name & Info */}
            <div className="flex-1 min-w-0 pt-12">
              <h1 className="text-xl font-bold text-gray-900">
                {profile?.name || user?.name}
              </h1>
              {profile?.username && (
                <p className="text-sm text-indigo-600">
                  @{profile.username}
                </p>
              )}
              {profile?.currentRole && (
                <p className="text-sm text-gray-600 mt-0.5">
                  {profile.currentRole}
                  {profile.currentCompany &&
                    ` at ${profile.currentCompany}`}
                </p>
              )}
              <div className="flex items-center gap-3 mt-1
                              flex-wrap">
                {profile?.location && (
                  <span className="text-xs text-gray-500 flex
                                   items-center gap-1">
                    📍 {profile.location}
                  </span>
                )}
                {profile?.collegeName && (
                  <span className="text-xs text-gray-500 flex
                                   items-center gap-1">
                    🎓 {profile.collegeName}
                  </span>
                )}
              </div>
            </div>

            {/* Completion Ring */}
            <div className="flex flex-col items-center pt-10">
              <svg width="88" height="88" viewBox="0 0 88 88">
                <circle cx="44" cy="44" r={R}
                  fill="none" stroke="#e5e7eb" strokeWidth="8"/>
                <circle cx="44" cy="44" r={R}
                  fill="none"
                  stroke={ringColor}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${dash} ${circ}`}
                  strokeDashoffset={circ / 4}
                  style={{
                    transition: 'stroke-dasharray 0.6s ease'
                  }}
                />
                <text x="44" y="48" textAnchor="middle"
                  fontSize="15" fontWeight="700"
                  fill={ringColor}>
                  {pct}%
                </text>
              </svg>
              <p className="text-xs text-gray-500 -mt-1">
                Profile Complete
              </p>
            </div>
          </div>

          {/* Missing fields */}
          {completion?.missingFields?.length > 0 && (
            <div className="mt-2 p-3 bg-amber-50 rounded-xl
                            border border-amber-200">
              <p className="text-xs font-medium text-amber-700 mb-2">
                Complete these to reach 100%:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {completion.missingFields.map(f => (
                  <span key={f}
                        className="px-2 py-0.5 bg-amber-100
                                   text-amber-700 rounded text-xs">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* AI Review Button */}
          <div className="mt-4 flex gap-3">
            <button
              onClick={handleReview}
              disabled={reviewing}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600
                         to-purple-600 text-white text-sm font-medium
                         rounded-lg hover:opacity-90 transition-opacity
                         disabled:opacity-60 flex items-center gap-2">
              {reviewing ? (
                <div className="w-4 h-4 border-2 border-white
                                border-t-transparent rounded-full
                                animate-spin"/>
              ) : '🤖'}
              {reviewing ? 'Analyzing...' : 'Analyze My Profile'}
            </button>
          </div>
        </div>
      </div>

      {/* ── AI Review Result ─────────────────────────────────── */}
      {review && (
        <div className="bg-white rounded-2xl border border-gray-200
                        p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900">
              🤖 AI Profile Analysis
            </h3>
            <button
              onClick={() => setReview(null)}
              className="text-gray-400 hover:text-gray-600 text-lg">
              ×
            </button>
          </div>

          {/* Score */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className={`text-4xl font-bold
                ${review.overallScore >= 70 ? 'text-green-600'
                  : review.overallScore >= 50 ? 'text-amber-600'
                  : 'text-red-600'}`}>
                {review.overallScore}
              </p>
              <p className="text-xs text-gray-500">Overall Score</p>
            </div>
            <div>
              <span className={`px-3 py-1 rounded-full text-sm
                font-semibold
                ${review.placementReadiness === 'Ready'
                    ? 'bg-green-100 text-green-700'
                    : review.placementReadiness === 'Almost Ready'
                      ? 'bg-blue-100 text-blue-700'
                      : review.placementReadiness === 'Needs Work'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-red-100 text-red-700'}`}>
                {review.placementReadiness}
              </span>
              <p className="text-sm text-gray-600 mt-2">
                {review.summary}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <ReviewSection title="✅ Strengths"
                           items={review.strengths}
                           color="green"/>
            <ReviewSection title="⚠️ Weaknesses"
                           items={review.weaknesses}
                           color="red"/>
            <ReviewSection title="📚 Missing Skills"
                           items={review.missingSkills}
                           color="amber"/>
            <ReviewSection title="🚀 Recommended Tech"
                           items={review.recommendedTechnologies}
                           color="blue"/>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <ReviewSection title="📝 Resume Suggestions"
                           items={review.resumeSuggestions}
                           color="purple"/>
            <ReviewSection title="🏢 Target Companies"
                           items={review.recommendedCompanies}
                           color="indigo"/>
          </div>
        </div>
      )}

      {/* ── Profile Analytics ────────────────────────────────── */}
      {dashboard && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: 'Applications Submitted', value: dashboard.totalApplications,  icon: '📋', color: 'blue'   },
            { label: 'Interviews Scheduled',   value: dashboard.totalPracticeSessions, icon: '🎤', color: 'purple' },
            { label: 'Questions Practiced',    value: dashboard.totalQuestionsAnswered, icon: '✍️', color: 'indigo' },
            { label: 'Avg Interview Score',
              value: dashboard.averageInterviewScore > 0
                      ? `${dashboard.averageInterviewScore}/10` : '—',
              icon: '🎯', color: 'green'  },
            { label: 'Profile Completion',
              value: `${dashboard.profileCompletion}%`,
              icon: '👤', color: 'amber'  },
            { label: 'Total XP Earned',        value: dashboard.totalXp,           icon: '⚡', color: 'orange'  },
          ].map(s => (
            <AnalyticsCard key={s.label} {...s}/>
          ))}
        </div>
      )}

      {/* ── Tabs ─────────────────────────────────────────────── */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium
              transition-colors flex items-center gap-1.5
              ${tab === t.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600'
                    + ' hover:bg-gray-50'}`}>
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── Tab Content ──────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200
                      p-6 shadow-sm">

        {/* Personal Info */}
        {tab === 'info' && (
          <div className="space-y-5">
            <SectionTitle icon="👤" title="Personal Information"/>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Full Name *" name="name"
                     value={form.name} onChange={handleChange}
                     placeholder="Sahil Jirapure"/>
              <Field label="Username" name="username"
                     value={form.username} onChange={handleChange}
                     placeholder="sahil_dev"/>
              <Field label="Current Role" name="currentRole"
                     value={form.currentRole} onChange={handleChange}
                     placeholder="Software Engineer"/>
              <Field label="Current Company" name="currentCompany"
                     value={form.currentCompany} onChange={handleChange}
                     placeholder="Google"/>
              <Field label="Phone" name="phone" type="tel"
                     value={form.phone} onChange={handleChange}
                     placeholder="+91 98765 43210"/>
              <Field label="Location" name="location"
                     value={form.location} onChange={handleChange}
                     placeholder="Pune, Maharashtra"/>
            </div>
            <div>
              <label className="block text-sm font-medium
                                 text-gray-700 mb-1">Bio</label>
              <textarea
                name="bio"
                value={form.bio}
                onChange={handleChange}
                rows={3}
                placeholder="Tell recruiters about yourself..."
                className="w-full px-3 py-2 rounded-xl border
                           border-gray-300 text-sm focus:outline-none
                           focus:ring-2 focus:ring-indigo-500
                           resize-none"
              />
            </div>
            <SaveBtn onClick={handleSave} loading={saving}/>
          </div>
        )}

        {/* Education */}
        {tab === 'education' && (
          <div className="space-y-5">
            <SectionTitle icon="🎓" title="Education & Experience"/>
            <div className="grid grid-cols-2 gap-4">
              <Field label="College / University"
                     name="collegeName"
                     value={form.collegeName}
                     onChange={handleChange}
                     placeholder="MIT ADT University"/>
              <Field label="Degree" name="degree"
                     value={form.degree}
                     onChange={handleChange}
                     placeholder="B.Tech"/>
              <Field label="Branch" name="branch"
                     value={form.branch}
                     onChange={handleChange}
                     placeholder="Computer Science"/>
              <Field label="Graduation Year"
                     name="graduationYear" type="number"
                     value={form.graduationYear}
                     onChange={handleChange}
                     placeholder="2025"/>
              <Field label="CGPA" name="cgpa" type="number"
                     value={form.cgpa}
                     onChange={handleChange}
                     placeholder="8.5"/>
              <Field label="Experience (years)"
                     name="experienceYears" type="number"
                     value={form.experienceYears}
                     onChange={handleChange}
                     placeholder="0"/>
            </div>
            <SaveBtn onClick={handleSave} loading={saving}/>
          </div>
        )}

        {/* Skills */}
        {tab === 'skills' && (
          <div className="space-y-5">
            <SectionTitle icon="🛠" title="Technical Skills"/>

            {/* Add skill input */}
            <div className="flex gap-2">
              <input
                value={skillInput}
                onChange={e => setSkillInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSkill(skillInput);
                  }
                }}
                placeholder="Type a skill and press Enter..."
                className="flex-1 px-3 py-2 rounded-xl border
                           border-gray-300 text-sm focus:outline-none
                           focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={() => addSkill(skillInput)}
                className="px-4 py-2 bg-indigo-600 text-white
                           text-sm rounded-xl hover:bg-indigo-700
                           transition-colors">
                Add
              </button>
            </div>

            {/* Skill Chips */}
            <div className="flex flex-wrap gap-2 min-h-12">
              {form.skills.length === 0 ? (
                <p className="text-sm text-gray-400">
                  No skills added yet
                </p>
              ) : (
                form.skills.map(skill => (
                  <span
                    key={skill}
                    className="flex items-center gap-1.5 px-3 py-1.5
                               bg-indigo-50 text-indigo-700 rounded-full
                               text-sm border border-indigo-200
                               font-medium">
                    {skill}
                    <button
                      onClick={() => removeSkill(skill)}
                      className="w-4 h-4 rounded-full bg-indigo-200
                                 hover:bg-red-200 hover:text-red-700
                                 flex items-center justify-center
                                 text-xs transition-colors">
                      ×
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Quick Add */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">
                Quick add:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {SKILL_SUGGESTIONS
                  .filter(s => !form.skills.includes(s))
                  .map(s => (
                    <button
                      key={s}
                      onClick={() => addSkill(s)}
                      className="px-2.5 py-1 bg-gray-100
                                 text-gray-600 rounded-full text-xs
                                 hover:bg-indigo-50 hover:text-indigo-700
                                 transition-colors">
                      + {s}
                    </button>
                  ))}
              </div>
            </div>

            <SaveBtn onClick={handleSave} loading={saving}/>
          </div>
        )}

        {/* Social Links */}
        {tab === 'social' && (
          <div className="space-y-5">
            <SectionTitle icon="🌐" title="Social & Coding Profiles"/>
            <div className="space-y-3">
              {[
                { name: 'githubUrl',     icon: '⚡', label: 'GitHub',     placeholder: 'https://github.com/username'         },
                { name: 'linkedinUrl',   icon: '💼', label: 'LinkedIn',   placeholder: 'https://linkedin.com/in/username'    },
                { name: 'portfolioUrl',  icon: '🌐', label: 'Portfolio',  placeholder: 'https://yourportfolio.com'           },
                { name: 'leetcodeUrl',   icon: '💻', label: 'LeetCode',   placeholder: 'https://leetcode.com/username'       },
                { name: 'codechefUrl',   icon: '👨‍💻', label: 'CodeChef',  placeholder: 'https://codechef.com/users/username' },
                { name: 'codeforcesUrl', icon: '🏆', label: 'Codeforces', placeholder: 'https://codeforces.com/profile/user' },
              ].map(f => (
                <div key={f.name}>
                  <label className="block text-sm font-medium
                                     text-gray-700 mb-1
                                     flex items-center gap-2">
                    <span>{f.icon}</span> {f.label}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      name={f.name}
                      value={form[f.name]}
                      onChange={handleChange}
                      placeholder={f.placeholder}
                      className="flex-1 px-3 py-2 rounded-xl border
                                 border-gray-300 text-sm
                                 focus:outline-none focus:ring-2
                                 focus:ring-indigo-500"
                    />
                    {form[f.name] && (
    <a href={form[f.name]}
        target="_blank"
        rel="noopener noreferrer"
        className="px-3 py-2 bg-gray-100 text-gray-600
                   rounded-xl text-xs hover:bg-indigo-50
                   hover:text-indigo-700 transition-colors">
        Visit →
    </a>
)}
                  </div>
                </div>
              ))}
            </div>
            <SaveBtn onClick={handleSave} loading={saving}/>
          </div>
        )}

        {/* Career Goals */}
        {tab === 'goals' && (
          <div className="space-y-5">
            <SectionTitle icon="🎯" title="Career Goals"/>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Target Role" name="targetRoleGoal"
                     value={form.targetRoleGoal}
                     onChange={handleChange}
                     placeholder="Software Engineer at FAANG"/>
              <div>
                <label className="block text-sm font-medium
                                   text-gray-700 mb-1">
                  Job Type
                </label>
                <select
                  name="jobType"
                  value={form.jobType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-xl border
                             border-gray-300 text-sm
                             focus:outline-none focus:ring-2
                             focus:ring-indigo-500">
                  <option value="">Select job type</option>
                  {JOB_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <Field label="Preferred Location"
                     name="preferredLocation"
                     value={form.preferredLocation}
                     onChange={handleChange}
                     placeholder="Bangalore / Remote"/>
              <Field label="Expected Salary (LPA)"
                     name="expectedSalary"
                     value={form.expectedSalary}
                     onChange={handleChange}
                     placeholder="10-15 LPA"/>
            </div>
            <div>
              <label className="block text-sm font-medium
                                 text-gray-700 mb-1">
                Preferred Companies
              </label>
              <input
                name="preferredCompanies"
                value={form.preferredCompanies}
                onChange={handleChange}
                placeholder="Google, Amazon, Microsoft, Flipkart..."
                className="w-full px-3 py-2 rounded-xl border
                           border-gray-300 text-sm focus:outline-none
                           focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <SaveBtn onClick={handleSave} loading={saving}/>
          </div>
        )}

        {/* Resume */}
        {tab === 'resume' && (
          <div className="space-y-4">
            <SectionTitle icon="📄" title="Active Resume"/>
            {profile?.activeResumeLabel ? (
              <div className="p-5 bg-indigo-50 border border-indigo-200
                              rounded-xl">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {profile.activeResumeLabel}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Version {profile.activeResumeVersion}
                      {profile.activeResumeUpdatedAt
                        && ` · ${profile.activeResumeUpdatedAt}`}
                    </p>
                    {profile.activeResumeAtsScore != null && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`px-2.5 py-0.5 rounded-full
                          text-xs font-semibold
                          ${profile.activeResumeAtsScore >= 70
                              ? 'bg-green-100 text-green-700'
                              : profile.activeResumeAtsScore >= 50
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-red-100 text-red-700'}`}>
                          ATS: {profile.activeResumeAtsScore}/100
                        </span>
                      </div>
                    )}
                  </div>
                  
                    <a href="/resume"
                        className="px-3 py-1.5 bg-indigo-600 text-white
                                  text-xs rounded-lg hover:bg-indigo-700
                                  transition-colors">
                        Open Resume Studio → </a>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 bg-gray-50
                              rounded-xl border border-dashed
                              border-gray-300">
                <p className="text-4xl mb-3">📄</p>
                <p className="text-sm font-medium text-gray-600">
                  No resume uploaded yet
                </p>
                <p className="text-xs text-gray-400 mt-1 mb-4">
                  Upload your resume to track versions and ATS scores
                </p>
                
                  <a
                      href="/resume"
                      className="px-4 py-2 bg-indigo-600 text-white
                                text-sm rounded-lg hover:bg-indigo-700
                                transition-colors"
                  >
                      Go to Resume Studio →
                  </a>
              </div>
            )}
          </div>
        )}

        {/* Security */}
        {tab === 'password' && (
          <form onSubmit={handlePasswordChange}
                className="space-y-5">
            <SectionTitle icon="🔒" title="Change Password"/>
            <div className="space-y-4 max-w-md">
              <Field label="Current Password"
                     name="currentPassword" type="password"
                     value={pwForm.currentPassword}
                     onChange={e => setPwForm({
                       ...pwForm,
                       currentPassword: e.target.value
                     })}
                     placeholder="Enter current password"/>
              <Field label="New Password"
                     name="newPassword" type="password"
                     value={pwForm.newPassword}
                     onChange={e => setPwForm({
                       ...pwForm,
                       newPassword: e.target.value
                     })}
                     placeholder="Min 6 characters"/>
              <Field label="Confirm New Password"
                     name="confirmPassword" type="password"
                     value={pwForm.confirmPassword}
                     onChange={e => setPwForm({
                       ...pwForm,
                       confirmPassword: e.target.value
                     })}
                     placeholder="Repeat new password"/>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700
                         text-white text-sm font-medium rounded-xl
                         transition-colors disabled:opacity-60
                         flex items-center gap-2">
              {saving && (
                <div className="w-4 h-4 border-2 border-white
                                border-t-transparent rounded-full
                                animate-spin"/>
              )}
              🔒 Change Password
            </button>
          </form>
        )}

        {/* XP & Level */}
        {tab === 'xp' && dashboard && (
          <XpTab dashboard={dashboard} />
        )}
      </div>

      {/* ── Achievements ─────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200
                      p-6 shadow-sm">
        <SectionTitle icon="🏆" title="Achievements"/>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          {ACHIEVEMENTS_DEF.map(a => {
            const isEarned = a.check(dashboard);
            return (
              <div
                key={a.id}
                className={`p-4 rounded-xl border text-center
                  transition-all
                  ${isEarned
                      ? 'bg-indigo-50 border-indigo-200'
                      : 'bg-gray-50 border-gray-200 opacity-50'}`}>
                <div className={`text-3xl mb-2
                  ${!isEarned ? 'grayscale' : ''}`}>
                  {a.icon}
                </div>
                <p className={`text-xs font-semibold
                  ${isEarned ? 'text-indigo-700' : 'text-gray-500'}`}>
                  {a.label}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {a.desc}
                </p>
                {isEarned && (
                  <span className="inline-block mt-2 px-2 py-0.5
                                   bg-green-100 text-green-700
                                   text-xs rounded-full">
                    Earned ✓
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────

function SectionTitle({ icon, title }) {
  return (
    <div className="flex items-center gap-2 mb-1">
      <span className="text-lg">{icon}</span>
      <h3 className="text-sm font-bold text-gray-900">{title}</h3>
    </div>
  );
}

function Field({ label, name, type = 'text', value,
                 onChange, placeholder }) {
  return (
    <div>
      <label className="block text-sm font-medium
                         text-gray-700 mb-1">
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-xl border border-gray-300
                   text-sm focus:outline-none focus:ring-2
                   focus:ring-indigo-500"
      />
    </div>
  );
}

function SaveBtn({ onClick, loading }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700
                 text-white text-sm font-medium rounded-xl
                 transition-colors disabled:opacity-60
                 flex items-center gap-2">
      {loading && (
        <div className="w-4 h-4 border-2 border-white
                        border-t-transparent rounded-full
                        animate-spin"/>
      )}
      {loading ? 'Saving...' : '💾 Save Changes'}
    </button>
  );
}

function ReviewSection({ title, items, color }) {
  const colors = {
    green:  'bg-green-50  text-green-700',
    red:    'bg-red-50    text-red-700',
    amber:  'bg-amber-50  text-amber-700',
    blue:   'bg-blue-50   text-blue-700',
    purple: 'bg-purple-50 text-purple-700',
    indigo: 'bg-indigo-50 text-indigo-700',
  };
  const dots = {
    green: 'bg-green-400', red: 'bg-red-400',
    amber: 'bg-amber-400', blue: 'bg-blue-400',
    purple: 'bg-purple-400', indigo: 'bg-indigo-400',
  };
  if (!items?.length) return null;
  return (
    <div className={`p-4 rounded-xl ${colors[color]}`}>
      <p className="text-xs font-bold uppercase tracking-wider mb-2">
        {title}
      </p>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-xs">
            <span className={`w-1.5 h-1.5 rounded-full mt-1
                              shrink-0 ${dots[color]}`}/>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function AnalyticsCard({ label, value, icon, color }) {
  const c = {
    blue:   'bg-blue-50   text-blue-700   border-blue-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    green:  'bg-green-50  text-green-700  border-green-200',
    amber:  'bg-amber-50  text-amber-700  border-amber-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
  };
  return (
    <div className={`p-4 rounded-xl border ${c[color]}`}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-medium opacity-75">{label}</p>
        <span className="text-lg">{icon}</span>
      </div>
      <p className="text-2xl font-bold">{value ?? '—'}</p>
    </div>
  );
}

function XpTab({ dashboard }) {
  const levelIcon = LEVEL_ICONS[dashboard.currentLevel] || '🌱';
  const circ      = 2 * Math.PI * 40;
  const dash      = (dashboard.progressPercent / 100) * circ;

  const activityIcon = (action) => {
    const map = {
      GENERATE_QUESTIONS:    '🧠',
      RESUME_ANALYSIS:       '📄',
      SKILL_GAP_ANALYSIS:    '📊',
      ANSWER_QUESTION:       '✍️',
      DAILY_CHECKIN:         '⚡',
      ADD_APPLICATION:       '📋',
      SCHEDULE_INTERVIEW:    '🎤',
      UPLOAD_RESUME:         '📤',
      GENERATE_RESUME:       '✨',
      ATS_SCAN:              '🎯',
      CAREER_COACH_CHAT:     '💬',
      PROFILE_COMPLETED:     '👤',
      COMPLETE_ROADMAP_ITEM: '🗺️',
    };
    return map[action] || '⚡';
  };

  const levels = [
    { name: 'Beginner',          xp: 0,   icon: '🌱' },
    { name: 'Learner',           xp: 50,  icon: '📚' },
    { name: 'Problem Solver',    xp: 150, icon: '⚙️' },
    { name: 'Interview Ready',   xp: 350, icon: '🎯' },
    { name: 'Placement Warrior', xp: 700, icon: '🏆' },
  ];

  return (
    <div className="space-y-6">
      <SectionTitle icon="🏆" title="XP & Level Progress"/>

      {/* Current Level Ring + Stats */}
      <div className="flex items-center gap-8 flex-wrap">
        <div className="shrink-0">
          <svg width="100" height="100" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40"
              fill="none" stroke="#e5e7eb" strokeWidth="10"/>
            <circle cx="50" cy="50" r="40"
              fill="none"
              stroke="#6366f1"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circ}`}
              strokeDashoffset={circ / 4}
              style={{ transition: 'stroke-dasharray 0.8s ease' }}
            />
            <text x="50" y="45" textAnchor="middle"
              fontSize="20" fill="#374151">
              {levelIcon}
            </text>
            <text x="50" y="65" textAnchor="middle"
              fontSize="12" fontWeight="700" fill="#6366f1">
              {dashboard.progressPercent}%
            </text>
          </svg>
        </div>

        <div className="flex-1 space-y-4 min-w-0">
          <div>
            <p className="text-xs text-gray-500 uppercase
                          tracking-wider">
              Current Level
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {levelIcon} {dashboard.currentLevel}
            </p>
          </div>

          <div>
            <div className="flex justify-between text-xs
                            text-gray-500 mb-1">
              <span>{dashboard.xpProgress} XP</span>
              <span>{dashboard.xpForNextLevel} XP</span>
            </div>
            <div className="w-full h-3 bg-gray-100 rounded-full
                            overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full
                           transition-all duration-700"
                style={{ width: `${dashboard.progressPercent}%` }}
              />
            </div>
            {dashboard.nextLevel !== 'MAX LEVEL' && (
              <p className="text-xs text-gray-500 mt-1">
                {(dashboard.xpForNextLevel || 0) -
                 (dashboard.xpProgress    || 0)} XP until{' '}
                {dashboard.nextLevel}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 shrink-0">
          {[
            { label: 'Total XP',     value: dashboard.totalXp,       color: 'indigo' },
            { label: 'Day Streak',   value: `🔥 ${dashboard.currentStreak}`, color: 'orange' },
            { label: 'Best Streak',  value: dashboard.longestStreak,  color: 'amber'  },
            { label: 'Check-ins',    value: dashboard.totalCheckins,  color: 'blue'   },
          ].map(s => (
            <div key={s.label}
                 className="text-center p-3 bg-gray-50
                            rounded-xl border border-gray-200">
              <p className="text-xl font-bold text-gray-900">
                {s.value}
              </p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Level Roadmap */}
      <div>
        <p className="text-sm font-semibold text-gray-900 mb-3">
          Level Roadmap
        </p>
        <div className="space-y-2">
          {levels.map(lv => {
            const reached  = dashboard.totalXp >= lv.xp;
            const isCurrent= dashboard.currentLevel === lv.name;
            return (
              <div key={lv.name}
                   className={`flex items-center gap-3 p-3
                     rounded-xl border transition-colors
                     ${isCurrent
                         ? 'bg-indigo-50 border-indigo-200'
                         : reached
                           ? 'bg-green-50 border-green-200'
                           : 'bg-gray-50 border-gray-200'}`}>
                <span className={`text-xl
                  ${!reached ? 'grayscale opacity-50' : ''}`}>
                  {lv.icon}
                </span>
                <div className="flex-1">
                  <p className={`text-sm font-medium
                    ${isCurrent ? 'text-indigo-700'
                      : reached ? 'text-green-700'
                      : 'text-gray-500'}`}>
                    {lv.name}
                    {isCurrent && (
                      <span className="ml-2 text-xs bg-indigo-100
                                       text-indigo-600 px-2 py-0.5
                                       rounded-full">
                        Current
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400">
                    {lv.xp} XP required
                  </p>
                </div>
                <span>{reached ? '✅' : '🔒'}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent XP Activity */}
      {dashboard.recentActivity?.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-900 mb-3">
            Recent XP Activity
          </p>
          <div className="space-y-2">
            {dashboard.recentActivity.map((tx, i) => (
              <div key={i}
                   className="flex items-center justify-between
                              p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-50
                                  flex items-center justify-center">
                    {activityIcon(tx.action)}
                  </div>
                  <div>
                    <p className="text-sm text-gray-800">
                      {tx.description}
                    </p>
                    <p className="text-xs text-gray-400">
                      {tx.createdAt}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-bold text-indigo-600">
                  +{tx.xpEarned} XP
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
