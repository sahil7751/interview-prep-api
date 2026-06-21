import { useState } from 'react';

const ROLES = [
  'Software Engineer', 'Frontend Developer',
  'Backend Developer', 'Full Stack Developer',
  'Data Scientist', 'DevOps Engineer',
  'Mobile Developer', 'System Design Engineer',
];

export default function SessionSetup({ onStart, loading }) {
  const [form, setForm] = useState({
    jobRole:         'Software Engineer',
    jobDescription:  '',
    experienceLevel: 'Fresher',
    questionCount:   5,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.jobDescription.trim()) {
      return;
    }
    onStart(form);
  };

  return (
    <div className="space-y-6">

      {/* Info Banner */}
      <div className="bg-indigo-50 border border-indigo-200
                      rounded-xl p-4">
        <h3 className="text-sm font-semibold text-indigo-800 mb-2">
          How it works
        </h3>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { icon: '🎯', title: 'Start Session',
              desc: 'Enter job details' },
            { icon: '✍️', title: 'Answer Questions',
              desc: 'Type your answers' },
            { icon: '🤖', title: 'Get AI Feedback',
              desc: 'Score + suggestions' },
          ].map(step => (
            <div key={step.title}
                 className="bg-white rounded-lg p-3
                            border border-indigo-100">
              <div className="text-2xl mb-1">{step.icon}</div>
              <p className="text-xs font-semibold text-gray-800">
                {step.title}
              </p>
              <p className="text-xs text-gray-500">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Setup Form */}
      <div className="bg-white rounded-xl border border-gray-200
                      p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-5">
          Configure Your Practice Session
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium
                                 text-gray-700 mb-1">
                Job Role
              </label>
              <select
                value={form.jobRole}
                onChange={e => setForm({
                  ...form, jobRole: e.target.value
                })}
                className="w-full px-3 py-2 rounded-lg border
                           border-gray-300 text-sm
                           focus:outline-none focus:ring-2
                           focus:ring-indigo-500">
                {ROLES.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
                <option value="custom">Other (type below)</option>
              </select>
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
                className="w-full px-3 py-2 rounded-lg border
                           border-gray-300 text-sm
                           focus:outline-none focus:ring-2
                           focus:ring-indigo-500">
                {['Fresher', '1 year', '2 years',
                  '3+ years', '5+ years'].map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium
                               text-gray-700 mb-1">
              Job Description *
            </label>
            <textarea
              value={form.jobDescription}
              onChange={e => setForm({
                ...form, jobDescription: e.target.value
              })}
              required
              rows={5}
              placeholder="Paste the job description here. The more detail you provide, the more relevant your questions will be..."
              className="w-full px-3 py-2 rounded-lg border
                         border-gray-300 text-sm
                         focus:outline-none focus:ring-2
                         focus:ring-indigo-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium
                               text-gray-700 mb-2">
              Number of Questions: {form.questionCount}
            </label>
            <input
              type="range"
              min={3} max={10} step={1}
              value={form.questionCount}
              onChange={e => setForm({
                ...form,
                questionCount: parseInt(e.target.value)
              })}
              className="w-full accent-indigo-600"
            />
            <div className="flex justify-between text-xs
                            text-gray-400 mt-1">
              <span>3 (Quick)</span>
              <span>7 (Standard)</span>
              <span>10 (Full)</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !form.jobDescription.trim()}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700
                       text-white font-medium rounded-lg
                       transition-colors disabled:opacity-60
                       flex items-center justify-center gap-2">
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white
                                border-t-transparent rounded-full
                                animate-spin"/>
                Generating questions...
              </>
            ) : (
              '🚀 Start Practice Session'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}



