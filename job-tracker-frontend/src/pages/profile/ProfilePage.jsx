
import { useState, useEffect, useRef } from 'react';
import { profileApi } from '../../api/profileApi';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { gamificationApi } from '../../api/gamificationApi';

const TABS = [
  { id: 'info',     label: '👤 Personal Info'  },
  { id: 'education',label: '🎓 Education'       },
  { id: 'skills',   label: '⚙️ Skills'          },
  { id: 'social',   label: '🔗 Social Links'    },
  { id: 'password', label: '🔒 Change Password' },
  { id: 'xp',       label: '⚡ XP & Level'      },
];

export default function ProfilePage() {
  const { user, login, token } = useAuth();
  const fileRef                = useRef();

  const [tab, setTab]         = useState('info');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [completion, setCompletion] = useState(null);

  // Form states
  const [form, setForm] = useState({
    name: '', username: '', phone: '', location: '', bio: '',
    collegeName: '', degree: '', branch: '',
    graduationYear: '', cgpa: '',
    experienceYears: '', currentCompany: '', currentRole: '',
    skills: [],
    githubUrl: '', linkedinUrl: '', portfolioUrl: '',
  });

  const [skillInput, setSkillInput] = useState('');

  const [pwForm, setPwForm] = useState({
    currentPassword: '', newPassword: '', confirmPassword: ''
  });

  useEffect(() => {
    fetchProfile();
    fetchCompletion();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await profileApi.getProfile();
      const p   = res.data.data;
      setProfile(p);
      setForm({
        name:           p.name            || '',
        username:       p.username        || '',
        phone:          p.phone           || '',
        location:       p.location        || '',
        bio:            p.bio             || '',
        collegeName:    p.collegeName     || '',
        degree:         p.degree          || '',
        branch:         p.branch          || '',
        graduationYear: p.graduationYear  || '',
        cgpa:           p.cgpa            || '',
        experienceYears:p.experienceYears || '',
        currentCompany: p.currentCompany  || '',
        currentRole:    p.currentRole     || '',
        skills:         p.skills          || [],
        githubUrl:      p.githubUrl       || '',
        linkedinUrl:    p.linkedinUrl     || '',
        portfolioUrl:   p.portfolioUrl    || '',
      });
    } catch {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompletion = async () => {
    try {
      const res = await profileApi.getCompletion();
      setCompletion(res.data.data);
    } catch {}
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (!skillInput.trim()) return;
    if (form.skills.includes(skillInput.trim())) return;
    setForm({ ...form, skills: [...form.skills, skillInput.trim()] });
    setSkillInput('');
  };

  const handleRemoveSkill = (skill) => {
    setForm({
      ...form,
      skills: form.skills.filter(s => s !== skill)
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await profileApi.updateProfile({
        ...form,
        graduationYear:  form.graduationYear
          ? parseInt(form.graduationYear) : null,
        cgpa:            form.cgpa
          ? parseFloat(form.cgpa) : null,
        experienceYears: form.experienceYears
          ? parseInt(form.experienceYears) : null,
      });
      setProfile(res.data.data);
      // Update name in auth context if changed
      login({ ...user, name: form.name }, token);
      toast.success('Profile updated!');
      fetchCompletion();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handlePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await profileApi.uploadPicture(fd);
      setProfile(res.data.data);
      toast.success('Profile picture updated!');
      fetchCompletion();
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
      toast.success('Password changed successfully!');
      setPwForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
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
  const circumference = 2 * Math.PI * 36;
  const dash = (pct / 100) * circumference;

  return (
    <div className="space-y-6 max-w-4xl">

      {/* Header Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start gap-6">

          {/* Avatar */}
          <div className="relative shrink-0">
            <div
              onClick={() => fileRef.current.click()}
              className="w-24 h-24 rounded-full bg-indigo-100
                         flex items-center justify-center
                         cursor-pointer overflow-hidden
                         border-4 border-white shadow-md
                         hover:opacity-90 transition-opacity">
              {profile?.profilePictureUrl ? (
                <img
                  src={`http://localhost:8081/api/v1${
                    profileApi.getPictureUrl()}?t=${Date.now()}`}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  onError={e => { e.target.style.display = 'none'; }}
                />
              ) : (
                <span className="text-3xl font-bold text-indigo-600">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <button
              onClick={() => fileRef.current.click()}
              className="absolute bottom-0 right-0 w-7 h-7
                         bg-indigo-600 rounded-full text-white
                         text-xs flex items-center justify-center
                         shadow hover:bg-indigo-700 transition-colors">
              ✏️
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handlePictureUpload}
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900">
              {profile?.name}
            </h2>
            {profile?.username && (
              <p className="text-sm text-indigo-600">
                @{profile.username}
              </p>
            )}
            <p className="text-sm text-gray-500">{profile?.email}</p>
            {profile?.currentRole && (
              <p className="text-sm text-gray-600 mt-1">
                {profile.currentRole}
                {profile.currentCompany &&
                  ` at ${profile.currentCompany}`}
              </p>
            )}
            {profile?.location && (
              <p className="text-xs text-gray-400 mt-0.5">
                📍 {profile.location}
              </p>
            )}
          </div>

          {/* Completion Ring */}
          <div className="shrink-0 text-center">
            <svg width="88" height="88" viewBox="0 0 88 88">
              <circle cx="44" cy="44" r="36"
                fill="none" stroke="#e5e7eb" strokeWidth="8"/>
              <circle cx="44" cy="44" r="36"
                fill="none"
                stroke={pct >= 80 ? '#22c55e'
                      : pct >= 50 ? '#f59e0b' : '#6366f1'}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${dash} ${circumference}`}
                strokeDashoffset={circumference / 4}
                style={{ transition: 'stroke-dasharray 0.5s ease' }}
              />
              <text x="44" y="48" textAnchor="middle"
                fontSize="16" fontWeight="600"
                fill={pct >= 80 ? '#16a34a'
                    : pct >= 50 ? '#d97706' : '#4f46e5'}>
                {pct}%
              </text>
            </svg>
            <p className="text-xs text-gray-500 -mt-1">
              Profile Complete
            </p>
          </div>
        </div>

        {/* Missing fields hint */}
        {completion?.missingFields?.length > 0 && (
          <div className="mt-4 p-3 bg-amber-50 rounded-lg
                          border border-amber-200">
            <p className="text-xs text-amber-700 font-medium mb-1">
              Complete these to reach 100%:
            </p>
            <div className="flex flex-wrap gap-1">
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
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium
              transition-colors
              ${tab === t.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-600'
                    + ' hover:bg-gray-50'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">

        {/* Personal Info */}
        {tab === 'info' && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Personal Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Full Name *" name="name"
                     value={form.name} onChange={handleChange}
                     placeholder="Rahul Sharma"/>
              <Field label="Username" name="username"
                     value={form.username} onChange={handleChange}
                     placeholder="rahul_sharma"/>
              <Field label="Phone" name="phone" type="tel"
                     value={form.phone} onChange={handleChange}
                     placeholder="+91 98765 43210"/>
              <Field label="Location" name="location"
                     value={form.location} onChange={handleChange}
                     placeholder="Pune, Maharashtra"/>
              <Field label="Current Role" name="currentRole"
                     value={form.currentRole} onChange={handleChange}
                     placeholder="Software Engineer"/>
              <Field label="Current Company" name="currentCompany"
                     value={form.currentCompany}
                     onChange={handleChange}
                     placeholder="Google"/>
              <div className="col-span-2">
                <label className="block text-sm font-medium
                                   text-gray-700 mb-1">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={form.bio}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Tell recruiters about yourself..."
                  className="w-full px-3 py-2 rounded-lg border
                             border-gray-300 text-sm focus:outline-none
                             focus:ring-2 focus:ring-indigo-500
                             resize-none"
                />
              </div>
            </div>
            <SaveButton onClick={handleSave} loading={saving}/>
          </div>
        )}

        {/* Education */}
        {tab === 'education' && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Education & Experience
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <Field label="College / University"
                     name="collegeName"
                     value={form.collegeName}
                     onChange={handleChange}
                     placeholder="IIT Bombay"/>
              <Field label="Degree" name="degree"
                     value={form.degree} onChange={handleChange}
                     placeholder="B.Tech"/>
              <Field label="Branch" name="branch"
                     value={form.branch} onChange={handleChange}
                     placeholder="Computer Science"/>
              <Field label="Graduation Year" name="graduationYear"
                     type="number" value={form.graduationYear}
                     onChange={handleChange} placeholder="2025"/>
              <Field label="CGPA" name="cgpa" type="number"
                     value={form.cgpa} onChange={handleChange}
                     placeholder="8.5"/>
              <Field label="Experience (years)" name="experienceYears"
                     type="number" value={form.experienceYears}
                     onChange={handleChange} placeholder="0"/>
            </div>
            <SaveButton onClick={handleSave} loading={saving}/>
          </div>
        )}

        {/* Skills */}
        {tab === 'skills' && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Technical Skills
            </h3>

            {/* Add skill */}
            <div className="flex gap-2">
              <input
                value={skillInput}
                onChange={e => setSkillInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAddSkill(e);
                }}
                placeholder="Type a skill and press Enter..."
                className="flex-1 px-3 py-2 rounded-lg border
                           border-gray-300 text-sm focus:outline-none
                           focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleAddSkill}
                className="px-4 py-2 bg-indigo-600 text-white
                           text-sm rounded-lg hover:bg-indigo-700
                           transition-colors">
                Add
              </button>
            </div>

            {/* Skill chips */}
            <div className="flex flex-wrap gap-2 min-h-12">
              {form.skills.length === 0 ? (
                <p className="text-sm text-gray-400">
                  No skills added yet
                </p>
              ) : (
                form.skills.map(skill => (
                  <span key={skill}
                        className="flex items-center gap-1.5
                                   px-3 py-1 bg-indigo-50
                                   text-indigo-700 rounded-full
                                   text-sm border border-indigo-200">
                    {skill}
                    <button
                      onClick={() => handleRemoveSkill(skill)}
                      className="text-indigo-400 hover:text-red-500
                                 transition-colors text-xs">
                      ✕
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Quick-add suggestions */}
            <div>
              <p className="text-xs text-gray-500 mb-2">
                Quick add:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {['Java','Python','React','Spring Boot',
                  'MySQL','MongoDB','Docker','Git',
                  'DSA','System Design','Node.js','AWS']
                  .filter(s => !form.skills.includes(s))
                  .map(s => (
                    <button
                      key={s}
                      onClick={() =>
                        setForm({
                          ...form,
                          skills: [...form.skills, s]
                        })
                      }
                      className="px-2.5 py-1 bg-gray-100
                                 text-gray-600 rounded-full
                                 text-xs hover:bg-indigo-50
                                 hover:text-indigo-700
                                 transition-colors">
                      + {s}
                    </button>
                  ))}
              </div>
            </div>

            <SaveButton onClick={handleSave} loading={saving}/>
          </div>
        )}

        {/* Social Links */}
        {tab === 'social' && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Social & Portfolio Links
            </h3>
            <Field label="GitHub URL" name="githubUrl"
                   type="url" value={form.githubUrl}
                   onChange={handleChange}
                   placeholder="https://github.com/yourusername"/>
            <Field label="LinkedIn URL" name="linkedinUrl"
                   type="url" value={form.linkedinUrl}
                   onChange={handleChange}
                   placeholder="https://linkedin.com/in/yourusername"/>
            <Field label="Portfolio URL" name="portfolioUrl"
                   type="url" value={form.portfolioUrl}
                   onChange={handleChange}
                   placeholder="https://yourportfolio.com"/>
            <SaveButton onClick={handleSave} loading={saving}/>
          </div>
        )}

        {/* Change Password */}
        {tab === 'password' && (
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Change Password
            </h3>
            <Field label="Current Password"
                   name="currentPassword" type="password"
                   value={pwForm.currentPassword}
                   onChange={e => setPwForm({
                     ...pwForm, currentPassword: e.target.value
                   })}
                   placeholder="Enter current password"/>
            <Field label="New Password"
                   name="newPassword" type="password"
                   value={pwForm.newPassword}
                   onChange={e => setPwForm({
                     ...pwForm, newPassword: e.target.value
                   })}
                   placeholder="Min 6 characters"/>
            <Field label="Confirm New Password"
                   name="confirmPassword" type="password"
                   value={pwForm.confirmPassword}
                   onChange={e => setPwForm({
                     ...pwForm, confirmPassword: e.target.value
                   })}
                   placeholder="Repeat new password"/>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700
                         text-white text-sm font-medium rounded-lg
                         transition-colors disabled:opacity-60
                         flex items-center gap-2">
              {saving && (
                <div className="w-4 h-4 border-2 border-white
                                border-t-transparent rounded-full
                                animate-spin"/>
              )}
              {saving ? 'Saving...' : '🔒 Change Password'}
            </button>
          </form>
        )}

        {tab === 'xp' && <XpStatsTab />}
      </div>
    </div>
  );
}

// ── Reusable Field ───────────────────────────────────────────────
function Field({ label, name, type = 'text',
                 value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg border border-gray-300
                   text-sm focus:outline-none focus:ring-2
                   focus:ring-indigo-500"
      />
    </div>
  );
}

// ── Save Button ──────────────────────────────────────────────────
function SaveButton({ onClick, loading }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700
                 text-white text-sm font-medium rounded-lg
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

function XpStatsTab() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    gamificationApi.getStats()
      .then(res => setStats(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-6 h-6 border-2 border-indigo-500
                        border-t-transparent rounded-full
                        animate-spin"/>
      </div>
    );
  }

  if (!stats) return null;

  const LEVEL_ICONS = {
    'Beginner':          '🌱',
    'Learner':           '📚',
    'Problem Solver':    '⚙️',
    'Interview Ready':   '🎯',
    'Placement Warrior': '🏆',
  };

  const levels = [
    { name: 'Beginner',          xp: 0   },
    { name: 'Learner',           xp: 50  },
    { name: 'Problem Solver',    xp: 150 },
    { name: 'Interview Ready',   xp: 350 },
    { name: 'Placement Warrior', xp: 700 },
  ];

  return (
    <div className="space-y-6">

      {/* Current Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-4 bg-indigo-50
                        rounded-xl border border-indigo-100">
          <p className="text-2xl font-bold text-indigo-700">
            {stats.totalXp}
          </p>
          <p className="text-xs text-gray-500 mt-1">Total XP</p>
        </div>
        <div className="text-center p-4 bg-orange-50
                        rounded-xl border border-orange-100">
          <p className="text-2xl font-bold text-orange-600">
            🔥 {stats.currentStreak}
          </p>
          <p className="text-xs text-gray-500 mt-1">Day Streak</p>
        </div>
        <div className="text-center p-4 bg-green-50
                        rounded-xl border border-green-100">
          <p className="text-2xl font-bold text-green-700">
            {stats.totalCheckins}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Total Check-ins
          </p>
        </div>
      </div>

      {/* Level Progress */}
      <div className="p-4 bg-white border border-gray-200
                      rounded-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">
              {LEVEL_ICONS[stats.currentLevel]}
            </span>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {stats.currentLevel}
              </p>
              <p className="text-xs text-gray-400">
                Current Level
              </p>
            </div>
          </div>
          {stats.nextLevel !== 'MAX LEVEL' && (
            <div className="text-right">
              <p className="text-xs text-gray-500">
                Next: {stats.nextLevel}
              </p>
              <p className="text-xs text-indigo-600 font-medium">
                {stats.xpForNextLevel - stats.xpProgress} XP to go
              </p>
            </div>
          )}
        </div>

        <div className="w-full h-3 bg-gray-100 rounded-full
                        overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full
                       transition-all duration-700"
            style={{ width: `${stats.progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-gray-400">
            {stats.xpProgress} XP
          </span>
          <span className="text-xs text-gray-400">
            {stats.xpForNextLevel} XP
          </span>
        </div>
      </div>

      {/* Level Roadmap */}
      <div>
        <p className="text-sm font-semibold text-gray-900 mb-3">
          Level Roadmap
        </p>
        <div className="space-y-2">
          {levels.map((level, i) => {
            const isReached  = stats.totalXp >= level.xp;
            const isCurrent  = stats.currentLevel === level.name;
            return (
              <div
                key={level.name}
                className={`flex items-center gap-3 p-3
                  rounded-lg border transition-colors
                  ${isCurrent
                      ? 'bg-indigo-50 border-indigo-200'
                      : isReached
                        ? 'bg-green-50 border-green-200'
                        : 'bg-gray-50 border-gray-200'}`}>
                <span className="text-lg">
                  {LEVEL_ICONS[level.name]}
                </span>
                <div className="flex-1">
                  <p className={`text-sm font-medium
                    ${isCurrent
                        ? 'text-indigo-700'
                        : isReached
                          ? 'text-green-700'
                          : 'text-gray-500'}`}>
                    {level.name}
                    {isCurrent && (
                      <span className="ml-2 text-xs
                                       bg-indigo-100
                                       text-indigo-600
                                       px-2 py-0.5 rounded-full">
                        Current
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400">
                    {level.xp} XP required
                  </p>
                </div>
                <span className="text-sm">
                  {isReached ? '✅' : '🔒'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent XP Activity */}
      {stats.recentActivity?.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-900 mb-3">
            Recent XP Activity
          </p>
          <div className="space-y-2">
            {stats.recentActivity.map((tx, i) => (
              <div key={i}
                   className="flex items-center justify-between
                              p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-800">
                    {tx.description}
                  </p>
                  <p className="text-xs text-gray-400">
                    {tx.createdAt}
                  </p>
                </div>
                <span className="text-sm font-bold
                                 text-indigo-600">
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



