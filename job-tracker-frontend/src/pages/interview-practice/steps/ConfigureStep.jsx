import { useState } from 'react';

const ROLES = [
  'Software Engineer','Frontend Developer','Backend Developer',
  'Full Stack Developer','Data Scientist','DevOps Engineer',
  'Mobile Developer','System Design Engineer','ML Engineer',
];

const INTERVIEW_TYPES = [
  { id: 'Technical',     icon: '⚙️', desc: 'Coding & concepts'    },
  { id: 'HR',            icon: '💼', desc: 'Culture & background'  },
  { id: 'Behavioral',    icon: '🧠', desc: 'Situation-based'       },
  { id: 'System Design', icon: '🏗️', desc: 'Architecture questions'},
  { id: 'Mixed',         icon: '🎯', desc: 'All of the above'      },
];

const DIFFICULTIES = [
  { id: 'Easy',     color: 'green',  desc: 'Campus & fresher level' },
  { id: 'Medium',   color: 'amber',  desc: 'Industry standard'      },
  { id: 'Hard',     color: 'red',    desc: 'FAANG level'            },
  { id: 'Adaptive', color: 'purple', desc: 'AI adjusts difficulty'  },
];

const COMPANIES = [
  'Google','Amazon','Microsoft','Meta','Apple',
  'Flipkart','Paytm','Zomato','Swiggy',
  'TCS','Infosys','Wipro','Accenture','Capgemini',
];

const SKILLS = [
  'Java','Python','JavaScript','React','Node.js',
  'Spring Boot','SQL','MongoDB','Docker','AWS',
  'DSA','System Design','TypeScript','C++','Kubernetes',
];

const EXP_LEVELS = ['Fresher','1 year','2 years','3+ years','5+ years'];

export default function ConfigureStep({ onStart }) {
  const [form, setForm] = useState({
    jobRole:         'Software Engineer',
    jobDescription:  '',
    interviewType:   'Mixed',
    difficulty:      'Medium',
    targetCompany:   '',
    selectedSkills:  [],
    experienceLevel: 'Fresher',
    questionCount:   5,
    timedMode:       false,
    timeLimitMinutes: 30,
  });
  const [errors, setErrors] = useState({});

  const toggle = (field, value) => {
    const current = form[field];
    setForm({
      ...form,
      [field]: current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value],
    });
  };

  const xpReward = form.questionCount * 2 + 5;
  const estTime  = form.questionCount * 3;

  const validate = () => {
    const errs = {};
    if (!form.jobRole)        errs.jobRole = 'Select a role';
    if (!form.jobDescription.trim())
      errs.jobDescription = 'Add a job description or role details';
    return errs;
  };

  const handleStart = () => {
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    onStart(form);
  };

  const diffColors = {
    green:  'border-green-400  bg-green-50   text-green-700',
    amber:  'border-amber-400  bg-amber-50   text-amber-700',
    red:    'border-red-400    bg-red-50     text-red-700',
    purple: 'border-purple-400 bg-purple-50  text-purple-700',
  };

  return (
    <div className="space-y-5">

      {/* Role + Experience */}
      <div className="bg-white rounded-2xl border border-gray-200
                      p-6 space-y-4">
        <h3 className="text-sm font-bold text-gray-900 flex
                       items-center gap-2">
          🎯 Interview Configuration
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium
                               text-gray-700 mb-1">
              Job Role *
            </label>
            <select
              value={form.jobRole}
              onChange={e => setForm({
                ...form, jobRole: e.target.value
              })}
              className="w-full px-3 py-2 rounded-xl border
                         border-gray-300 text-sm focus:outline-none
                         focus:ring-2 focus:ring-indigo-500">
              {ROLES.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            {errors.jobRole && (
              <p className="text-red-500 text-xs mt-1">
                {errors.jobRole}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium
                               text-gray-700 mb-1">
              Experience Level
            </label>
            <select
              value={form.experienceLevel}
              onChange={e => setForm({
                ...form, experienceLevel: e.target.value
              })}
              className="w-full px-3 py-2 rounded-xl border
                         border-gray-300 text-sm focus:outline-none
                         focus:ring-2 focus:ring-indigo-500">
              {EXP_LEVELS.map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Job Description */}
        <div>
          <label className="block text-sm font-medium
                             text-gray-700 mb-1">
            Job Description / Role Details *
          </label>
          <textarea
            value={form.jobDescription}
            onChange={e => {
              setForm({ ...form, jobDescription: e.target.value });
              setErrors({ ...errors, jobDescription: '' });
            }}
            rows={4}
            placeholder="Paste the job description here or describe the role. The AI will generate company-specific interview questions tailored to this description..."
            className={`w-full px-3 py-2.5 rounded-xl border
              text-sm focus:outline-none focus:ring-2
              focus:ring-indigo-500 resize-none
              ${errors.jobDescription
                  ? 'border-red-400' : 'border-gray-300'}`}
          />
          {errors.jobDescription && (
            <p className="text-red-500 text-xs mt-1">
              {errors.jobDescription}
            </p>
          )}
        </div>
      </div>

      {/* Interview Type */}
      <div className="bg-white rounded-2xl border border-gray-200
                      p-6 space-y-4">
        <h3 className="text-sm font-bold text-gray-900">
          🎤 Interview Type
        </h3>
        <div className="grid grid-cols-5 gap-2">
          {INTERVIEW_TYPES.map(t => (
            <button
              key={t.id}
              onClick={() =>
                setForm({ ...form, interviewType: t.id })
              }
              className={`p-3 rounded-xl border-2 text-center
                transition-all
                ${form.interviewType === t.id
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'}`}>
              <div className="text-2xl mb-1">{t.icon}</div>
              <p className="text-xs font-semibold text-gray-800">
                {t.id}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {t.desc}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty */}
      <div className="bg-white rounded-2xl border border-gray-200
                      p-6 space-y-4">
        <h3 className="text-sm font-bold text-gray-900">
          📊 Difficulty Level
        </h3>
        <div className="grid grid-cols-4 gap-3">
          {DIFFICULTIES.map(d => (
            <button
              key={d.id}
              onClick={() =>
                setForm({ ...form, difficulty: d.id })
              }
              className={`p-3 rounded-xl border-2 text-center
                transition-all
                ${form.difficulty === d.id
                    ? diffColors[d.color]
                      + ' border-2'
                    : 'border-gray-200 hover:border-gray-300'}`}>
              <p className="text-sm font-bold">{d.id}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {d.desc}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Target Company */}
      <div className="bg-white rounded-2xl border border-gray-200
                      p-6 space-y-4">
        <h3 className="text-sm font-bold text-gray-900">
          🏢 Target Company
          <span className="font-normal text-gray-400 ml-1">
            (optional)
          </span>
        </h3>
        <div className="flex flex-wrap gap-2">
          {COMPANIES.map(c => (
            <button
              key={c}
              onClick={() => setForm({
                ...form,
                targetCompany: form.targetCompany === c ? '' : c
              })}
              className={`px-3 py-1.5 rounded-full text-xs
                font-medium border transition-colors
                ${form.targetCompany === c
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-600 border-gray-300'
                      + ' hover:border-indigo-300'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Skills */}
      <div className="bg-white rounded-2xl border border-gray-200
                      p-6 space-y-4">
        <h3 className="text-sm font-bold text-gray-900">
          🛠 Skills Focus
          <span className="font-normal text-gray-400 ml-1">
            (optional — select all that apply)
          </span>
        </h3>
        <div className="flex flex-wrap gap-2">
          {SKILLS.map(s => (
            <button
              key={s}
              onClick={() => toggle('selectedSkills', s)}
              className={`px-3 py-1.5 rounded-full text-xs
                font-medium border transition-colors
                ${form.selectedSkills.includes(s)
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-600 border-gray-300'
                      + ' hover:border-indigo-300'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Questions + Timer */}
      <div className="bg-white rounded-2xl border border-gray-200
                      p-6 space-y-5">
        <h3 className="text-sm font-bold text-gray-900">
          ⚙️ Session Settings
        </h3>

        {/* Question count slider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">
              Number of Questions
            </label>
            <span className="text-sm font-bold text-indigo-600">
              {form.questionCount}
            </span>
          </div>
          <input
            type="range" min={3} max={10} step={1}
            value={form.questionCount}
            onChange={e => setForm({
              ...form, questionCount: parseInt(e.target.value)
            })}
            className="w-full accent-indigo-600"
          />
          <div className="flex justify-between text-xs
                          text-gray-400 mt-1">
            <span>3 (Quick)</span>
            <span>6 (Standard)</span>
            <span>10 (Full)</span>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Questions',      value: form.questionCount },
            { label: 'Est. Time',      value: `~${estTime} min` },
            { label: 'XP Reward',      value: `+${xpReward} XP` },
            { label: 'Difficulty',     value: form.difficulty    },
          ].map(s => (
            <div key={s.label}
                 className="text-center p-3 bg-gray-50
                            rounded-xl border border-gray-200">
              <p className="text-base font-bold text-indigo-700">
                {s.value}
              </p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Timed mode */}
        <div className="flex items-center justify-between p-3
                        bg-gray-50 rounded-xl border border-gray-200">
          <div>
            <p className="text-sm font-medium text-gray-800">
              ⏱ Timed Mode
            </p>
            <p className="text-xs text-gray-500">
              Set a countdown timer for the interview
            </p>
          </div>
          <label className="flex items-center gap-2
                            cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={form.timedMode}
                onChange={e => setForm({
                  ...form, timedMode: e.target.checked
                })}
                className="sr-only"
              />
              <div className={`w-10 h-6 rounded-full transition-colors
                ${form.timedMode ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                <div className={`w-4 h-4 bg-white rounded-full
                  absolute top-1 transition-transform
                  ${form.timedMode
                      ? 'translate-x-5' : 'translate-x-1'}`}/>
              </div>
            </div>
          </label>
        </div>

        {form.timedMode && (
          <div>
            <label className="block text-sm font-medium
                               text-gray-700 mb-2">
              Time Limit: {form.timeLimitMinutes} minutes
            </label>
            <input
              type="range" min={10} max={90} step={5}
              value={form.timeLimitMinutes}
              onChange={e => setForm({
                ...form, timeLimitMinutes: parseInt(e.target.value)
              })}
              className="w-full accent-indigo-600"
            />
          </div>
        )}
      </div>

      {/* Start Button */}
      <div className="text-center space-y-2">
        <button
          onClick={handleStart}
          disabled={!form.jobDescription.trim()}
          className="w-full py-4 bg-gradient-to-r from-indigo-600
                     to-purple-600 text-white font-bold rounded-2xl
                     text-base transition-all hover:opacity-90
                     disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center justify-center gap-3
                     shadow-lg hover:shadow-xl
                     hover:-translate-y-0.5">
          🚀 Start AI Interview
        </button>
        <p className="text-sm text-gray-500">
          Earn <span className="font-bold text-indigo-600">
            +{xpReward} XP
          </span> for completing this session
        </p>
      </div>
    </div>
  );
}
