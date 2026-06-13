import { useState } from 'react';
import { aiApi } from '../../api/aiApi';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'resume',     label: '📄 Resume Analysis'    },
  { id: 'questions',  label: '🎤 Interview Questions' },
  { id: 'skillgap',   label: '📊 Skill Gap'           },
  { id: 'prep',       label: '🚀 Placement Prep'      },
];

export default function AIAssistant() {
  const [tab, setTab]         = useState('resume');
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);

  // Form states
  const [resumeText, setResumeText]   = useState('');
  const [jd, setJd]                   = useState('');
  const [jobRole, setJobRole]         = useState('');
  const [expLevel, setExpLevel]       = useState('Fresher');
  const [qCount, setQCount]           = useState(10);
  const [skills, setSkills]           = useState('');
  const [targetRole, setTargetRole]   = useState('');

  const reset = () => setResult(null);

  // ── Resume Analysis ─────────────────────────────────────────
  const handleResumeAnalysis = async () => {
    if (!resumeText.trim()) {
      toast.error('Paste your resume text first');
      return;
    }
    setLoading(true); setResult(null);
    try {
      const res = await aiApi.analyzeResume({
        resumeText,
        jobDescription: jd || undefined,
      });
      setResult({ type: 'resume', data: res.data.data });
    } catch {
      toast.error('AI analysis failed. Check your API key.');
    } finally {
      setLoading(false);
    }
  };

  // ── Interview Questions ──────────────────────────────────────
  const handleGenerateQuestions = async () => {
    if (!jd.trim()) { toast.error('Enter job description'); return; }
    setLoading(true); setResult(null);
    try {
      const res = await aiApi.generateQuestions({
        jobDescription: jd,
        jobRole:        jobRole || 'Software Engineer',
        experienceLevel: expLevel,
        questionCount:  qCount,
      });
      setResult({ type: 'questions', data: res.data.data });
    } catch {
      toast.error('Failed to generate questions');
    } finally {
      setLoading(false);
    }
  };

  // ── Skill Gap ────────────────────────────────────────────────
  const handleSkillGap = async () => {
    if (!jd.trim() || !skills.trim()) {
      toast.error('Fill in job description and your skills');
      return;
    }
    setLoading(true); setResult(null);
    try {
      const res = await aiApi.skillGap({
        jobDescription: jd,
        currentSkills:  skills,
        targetRole:     targetRole || 'Software Engineer',
      });
      setResult({ type: 'skillgap', data: res.data.data });
    } catch {
      toast.error('Skill gap analysis failed');
    } finally {
      setLoading(false);
    }
  };

  // ── Placement Prep ───────────────────────────────────────────
  const handlePlacementPrep = async () => {
    if (!targetRole.trim()) {
      toast.error('Enter a target role');
      return;
    }
    setLoading(true); setResult(null);
    try {
      const res = await aiApi.placementPrep({
        jobDescription: jd || '',
        targetRole,
      });
      setResult({ type: 'prep', data: res.data.data });
    } catch {
      toast.error('Failed to generate prep guide');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          AI Career Assistant
        </h2>
        <p className="text-gray-500 text-sm mt-0.5">
          Powered by Gemini — resume analysis, interview prep, and more
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); reset(); }}
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

      {/* Input Panel */}
      <div className="bg-white rounded-xl border border-gray-200 p-6
                      space-y-4">

        {/* Resume Analysis Inputs */}
        {tab === 'resume' && (
          <>
            <div>
              <label className="block text-sm font-medium
                                 text-gray-700 mb-1">
                Paste Your Resume Text *
              </label>
              <textarea
                value={resumeText}
                onChange={e => setResumeText(e.target.value)}
                rows={8}
                placeholder="Paste your full resume content here..."
                className="w-full px-3 py-2 rounded-lg border
                           border-gray-300 text-sm focus:outline-none
                           focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium
                                 text-gray-700 mb-1">
                Target Job Description (optional)
              </label>
              <textarea
                value={jd}
                onChange={e => setJd(e.target.value)}
                rows={3}
                placeholder="Paste the job description for better analysis..."
                className="w-full px-3 py-2 rounded-lg border
                           border-gray-300 text-sm focus:outline-none
                           focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>
            <button onClick={handleResumeAnalysis}
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
              {loading ? 'Analyzing...' : '✨ Analyze Resume'}
            </button>
          </>
        )}

        {/* Interview Questions Inputs */}
        {tab === 'questions' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium
                                   text-gray-700 mb-1">
                  Job Role
                </label>
                <input
                  value={jobRole}
                  onChange={e => setJobRole(e.target.value)}
                  placeholder="Software Engineer"
                  className="w-full px-3 py-2 rounded-lg border
                             border-gray-300 text-sm focus:outline-none
                             focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium
                                   text-gray-700 mb-1">
                  Experience Level
                </label>
                <select
                  value={expLevel}
                  onChange={e => setExpLevel(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border
                             border-gray-300 text-sm focus:outline-none
                             focus:ring-2 focus:ring-indigo-500">
                  {['Fresher','1 year','2 years','3+ years'].map(l => (
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
                value={jd}
                onChange={e => setJd(e.target.value)}
                rows={5}
                placeholder="Paste the job description here..."
                className="w-full px-3 py-2 rounded-lg border
                           border-gray-300 text-sm focus:outline-none
                           focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">
                Number of questions:
              </label>
              <input
                type="number"
                min={5} max={20}
                value={qCount}
                onChange={e => setQCount(Number(e.target.value))}
                className="w-20 px-3 py-2 rounded-lg border
                           border-gray-300 text-sm focus:outline-none
                           focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button onClick={handleGenerateQuestions}
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
              {loading ? 'Generating...' : '🎤 Generate Questions'}
            </button>
          </>
        )}

        {/* Skill Gap Inputs */}
        {tab === 'skillgap' && (
          <>
            <div>
              <label className="block text-sm font-medium
                                 text-gray-700 mb-1">
                Target Role
              </label>
              <input
                value={targetRole}
                onChange={e => setTargetRole(e.target.value)}
                placeholder="Full Stack Developer"
                className="w-full px-3 py-2 rounded-lg border
                           border-gray-300 text-sm focus:outline-none
                           focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium
                                 text-gray-700 mb-1">
                Your Current Skills *
              </label>
              <input
                value={skills}
                onChange={e => setSkills(e.target.value)}
                placeholder="Java, Spring Boot, MySQL, React basics, Git"
                className="w-full px-3 py-2 rounded-lg border
                           border-gray-300 text-sm focus:outline-none
                           focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium
                                 text-gray-700 mb-1">
                Job Description *
              </label>
              <textarea
                value={jd}
                onChange={e => setJd(e.target.value)}
                rows={4}
                placeholder="Paste the job description..."
                className="w-full px-3 py-2 rounded-lg border
                           border-gray-300 text-sm focus:outline-none
                           focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>
            <button onClick={handleSkillGap}
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
              {loading ? 'Analyzing...' : '📊 Analyze Skill Gap'}
            </button>
          </>
        )}

        {/* Placement Prep Inputs */}
        {tab === 'prep' && (
          <>
            <div>
              <label className="block text-sm font-medium
                                 text-gray-700 mb-1">
                Target Role *
              </label>
              <input
                value={targetRole}
                onChange={e => setTargetRole(e.target.value)}
                placeholder="Software Engineer at a product company"
                className="w-full px-3 py-2 rounded-lg border
                           border-gray-300 text-sm focus:outline-none
                           focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium
                                 text-gray-700 mb-1">
                Job Description (optional)
              </label>
              <textarea
                value={jd}
                onChange={e => setJd(e.target.value)}
                rows={4}
                placeholder="Add a job description for more specific prep..."
                className="w-full px-3 py-2 rounded-lg border
                           border-gray-300 text-sm focus:outline-none
                           focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>
            <button onClick={handlePlacementPrep}
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
              {loading ? 'Generating...' : '🚀 Generate Prep Guide'}
            </button>
          </>
        )}
      </div>

      {/* Results Panel */}
      {result && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">

          {/* Resume Analysis Result */}
          {result.type === 'resume' && (
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className={`text-4xl font-bold
                    ${result.data.atsScore >= 70
                        ? 'text-green-600'
                        : result.data.atsScore >= 50
                          ? 'text-amber-600'
                          : 'text-red-600'}`}>
                    {result.data.atsScore}
                  </div>
                  <div className="text-xs text-gray-500">ATS Score</div>
                </div>
                <div>
                  <span className={`px-3 py-1 rounded-full text-sm
                    font-medium
                    ${result.data.atsScore >= 70
                        ? 'bg-green-100 text-green-700'
                        : result.data.atsScore >= 50
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-red-100 text-red-700'}`}>
                    {result.data.scoreLabel}
                  </span>
                  <p className="text-sm text-gray-600 mt-2">
                    {result.data.overallFeedback}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Section title="✅ Strengths" color="green"
                         items={result.data.strengths} />
                <Section title="⚠️ Weaknesses" color="red"
                         items={result.data.weaknesses} />
              </div>
              <Section title="🔑 Missing Keywords" color="amber"
                       items={result.data.missingKeywords} />
              <Section title="💡 Improvement Suggestions" color="blue"
                       items={result.data.improvementSuggestions} />
            </div>
          )}

          {/* Questions Result */}
          {result.type === 'questions' && (
            <div className="space-y-5">
              <QSection title="⚙️ Technical Questions"
                        questions={result.data.technicalQuestions} />
              <QSection title="🧠 Behavioural Questions"
                        questions={result.data.behaviouralQuestions} />
              <QSection title="💼 HR Questions"
                        questions={result.data.hrQuestions} />
            </div>
          )}

          {/* Skill Gap Result */}
          {result.type === 'skillgap' && (
            <div className="space-y-5">
              <div className="flex items-center gap-4 mb-2">
                <div className="text-center">
                  <div className={`text-4xl font-bold
                    ${result.data.matchPercentage >= 70
                        ? 'text-green-600'
                        : result.data.matchPercentage >= 40
                          ? 'text-amber-600'
                          : 'text-red-600'}`}>
                    {result.data.matchPercentage}%
                  </div>
                  <div className="text-xs text-gray-500">Match</div>
                </div>
                <p className="text-sm text-gray-600">
                  {result.data.summary}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Section title="✅ You Have" color="green"
                         items={result.data.presentSkills} />
                <Section title="❌ Missing Skills" color="red"
                         items={result.data.missingSkills} />
              </div>
              <Section title="⭐ Nice to Have" color="amber"
                       items={result.data.niceToHaveSkills} />

              {result.data.learningPath?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">
                    📚 Learning Path
                  </h4>
                  <div className="space-y-2">
                    {result.data.learningPath.map((lp, i) => (
                      <div key={i}
                           className="flex items-start gap-3 p-3
                                      bg-indigo-50 rounded-lg">
                        <span className="w-6 h-6 rounded-full
                          bg-indigo-100 text-indigo-700 text-xs
                          font-bold flex items-center justify-center
                          shrink-0">
                          {i + 1}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {lp.skill}
                          </p>
                          <p className="text-xs text-gray-500">
                            {lp.suggestedResource}
                            {lp.estimatedTime &&
                              ` · ${lp.estimatedTime}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Placement Prep Result */}
          {result.type === 'prep' && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                🚀 Your Placement Prep Guide
              </h4>
              <pre className="text-sm text-gray-700 whitespace-pre-wrap
                              font-sans leading-relaxed">
                {result.data}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Helper sub-components ────────────────────────────────────────

function Section({ title, color, items }) {
  const colors = {
    green: 'bg-green-50',
    red:   'bg-red-50',
    amber: 'bg-amber-50',
    blue:  'bg-blue-50',
  };
  const dotColors = {
    green: 'bg-green-400',
    red:   'bg-red-400',
    amber: 'bg-amber-400',
    blue:  'bg-blue-400',
  };

  if (!items?.length) return null;

  return (
    <div className={`p-4 rounded-xl ${colors[color]}`}>
      <h4 className="text-sm font-semibold text-gray-800 mb-2">
        {title}
      </h4>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm
                                  text-gray-700">
            <span className={`w-1.5 h-1.5 rounded-full mt-1.5
                              shrink-0 ${dotColors[color]}`}/>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function QSection({ title, questions }) {
  const diff = {
    Easy:   'bg-green-100 text-green-700',
    Medium: 'bg-amber-100 text-amber-700',
    Hard:   'bg-red-100   text-red-700',
  };

  if (!questions?.length) return null;

  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-900 mb-3">
        {title}
      </h4>
      <div className="space-y-3">
        {questions.map((q, i) => (
          <div key={i} className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm text-gray-800 font-medium">
                {i + 1}. {q.question}
              </p>
              {q.difficulty && (
                <span className={`px-2 py-0.5 rounded text-xs
                  font-medium shrink-0
                  ${diff[q.difficulty] || 'bg-gray-100 text-gray-600'}`}>
                  {q.difficulty}
                </span>
              )}
            </div>
            {q.hint && (
              <p className="text-xs text-gray-500 mt-1.5 pl-3
                            border-l-2 border-gray-300">
                💡 {q.hint}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}