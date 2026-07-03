import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { aiHubApi }  from '../../api/aiHubApi';
import { useAuth }   from '../../context/AuthContext';
import toast from 'react-hot-toast';

// ── Constants ────────────────────────────────────────────────────
const COMPANIES = [
  'Google','Amazon','Microsoft','Meta','Apple',
  'Flipkart','Paytm','Zomato','Swiggy',
  'TCS','Infosys','Wipro','Accenture','Capgemini',
];

const INTERVIEW_TYPES = [
  'Technical','HR','Behavioral','System Design','Mixed'
];
const DIFFICULTIES = ['Easy','Medium','Hard','Adaptive'];

const MODES = [
  { id: 'resume',    icon: '📄', label: 'Resume Review',
    desc: 'AI-powered resume analysis & feedback',
    xp: 15, color: 'blue'   },
  { id: 'ats',       icon: '🎯', label: 'ATS Optimizer',
    desc: 'Check ATS score & keyword gaps',
    xp: 10, color: 'green'  },
  { id: 'questions', icon: '🎤', label: 'Interview Questions',
    desc: 'Generate role-specific questions',
    xp: 15, color: 'purple' },
  { id: 'skillgap',  icon: '📊', label: 'Skill Gap Analysis',
    desc: 'Find missing skills for your target role',
    xp: 10, color: 'amber'  },
  { id: 'company',   icon: '🏢', label: 'Company Prep',
    desc: 'Company-specific interview guide',
    xp: 20, color: 'red'    },
  { id: 'roadmap',   icon: '🗺️', label: 'Learning Roadmap',
    desc: 'Week-by-week personalized learning plan',
    xp: 20, color: 'teal'   },
  { id: 'placement', icon: '🚀', label: 'Placement Prep',
    desc: '30-day placement preparation strategy',
    xp: 15, color: 'indigo' },
  { id: 'chat',      icon: '💬', label: 'AI Career Coach',
    desc: 'Chat with your personal AI mentor',
    xp: 3,  color: 'pink'   },
];

const MODE_COLORS = {
  blue:   'bg-blue-50   border-blue-200   text-blue-700',
  green:  'bg-green-50  border-green-200  text-green-700',
  purple: 'bg-purple-50 border-purple-200 text-purple-700',
  amber:  'bg-amber-50  border-amber-200  text-amber-700',
  red:    'bg-red-50    border-red-200    text-red-700',
  teal:   'bg-teal-50   border-teal-200   text-teal-700',
  indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700',
  pink:   'bg-pink-50   border-pink-200   text-pink-700',
};

const SUGGESTED_PROMPTS = [
  '✨ Review my resume and suggest improvements',
  '🎯 What is my ATS score?',
  '🔥 Generate Java Spring Boot interview questions',
  '🏢 Prepare me for Google interview',
  '📊 Find my skill gaps for Full Stack Developer',
  '🗺️ Create a 8-week learning roadmap',
  '🚀 Give me a 30-day placement prep plan',
  '💡 Suggest backend projects for my portfolio',
];

const LOADING_MESSAGES = {
  resume:    ['Reading resume...','Analyzing structure...','Checking keywords...','Generating feedback...','Almost ready...'],
  ats:       ['Scanning ATS compatibility...','Checking keywords...','Analyzing formatting...','Building report...','Almost ready...'],
  questions: ['Selecting question pattern...','Calibrating difficulty...','Generating questions...','Adding hints...','Almost ready...'],
  skillgap:  ['Analyzing your skills...','Comparing to job requirements...','Finding gaps...','Building learning path...','Almost ready...'],
  company:   ['Researching company...','Analyzing interview pattern...','Preparing guide...','Building strategy...','Almost ready...'],
  roadmap:   ['Analyzing your skills...','Building weekly plan...','Adding resources...','Personalizing roadmap...','Almost ready...'],
  placement: ['Building placement strategy...','Preparing study plan...','Finding resources...','Creating timeline...','Almost ready...'],
  chat:      ['Thinking...','Personalizing response...','Almost ready...'],
};

// ── Score Bar Component ──────────────────────────────────────────
function ScoreBar({ label, score, max = 100, color = 'indigo' }) {
  const pct = Math.min(100, (score / max) * 100);
  const barColor = score >= 70 ? 'bg-green-500'
                 : score >= 50 ? 'bg-amber-500'
                 : 'bg-red-400';
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-xs text-gray-600">{label}</span>
        <span className="text-xs font-bold text-gray-800">
          {score}/{max}
        </span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Loading Screen ───────────────────────────────────────────────
function LoadingScreen({ mode }) {
  const [msgIdx, setMsgIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const messages = LOADING_MESSAGES[mode] || LOADING_MESSAGES.chat;

  useEffect(() => {
    const mi = setInterval(() =>
      setMsgIdx(i => Math.min(i+1, messages.length-1)), 1200);
    const pi = setInterval(() =>
      setProgress(p => Math.min(p+3, 95)), 120);
    return () => { clearInterval(mi); clearInterval(pi); };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center
                    min-h-64 py-12">
      <div className="bg-white rounded-3xl border border-gray-200
                      shadow-xl p-10 max-w-sm w-full text-center
                      space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br
                        from-indigo-600 to-purple-600 flex items-center
                        justify-center mx-auto animate-pulse shadow-lg">
          <span className="text-3xl">🤖</span>
        </div>
        <div>
          <p className="text-lg font-bold text-gray-900">
            CareerPilot AI
          </p>
          <p className="text-sm text-gray-500">
            {messages[msgIdx]}
          </p>
        </div>
        <div className="space-y-2">
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500
                         to-purple-500 rounded-full transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-400">{progress}%</p>
        </div>
      </div>
    </div>
  );
}

// ── XP Badge ────────────────────────────────────────────────────
function XpBadge({ xp }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1
                     bg-indigo-100 text-indigo-700 rounded-full
                     text-xs font-bold animate-bounce">
      ⚡ +{xp} XP earned!
    </span>
  );
}

// ── Main Component ───────────────────────────────────────────────
export default function AIHub() {
  const { user }   = useAuth();
  const navigate   = useNavigate();

  const [mode, setMode]           = useState(null);
  const [context, setContext]     = useState(null);
  const [readiness, setReadiness] = useState(null);
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState(null);
  const [xpEarned, setXpEarned]   = useState(0);

  // Form states
  const [resumeText, setResumeText]     = useState('');
  const [jobDesc, setJobDesc]           = useState('');
  const [targetRole, setTargetRole]     = useState('');
  const [targetCompany, setTargetCompany] = useState('');
  const [currentSkills, setSkills]      = useState('');
  const [interviewType, setIntType]     = useState('Mixed');
  const [difficulty, setDifficulty]     = useState('Medium');
  const [qCount, setQCount]             = useState(5);
  const [resumeInputMode, setResMode]   = useState('active'); // active | paste | upload
  const [activeResumeData, setActiveResume] = useState(null);
  const [loadingActiveResume, setLoadingAR] = useState(false);

  // Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput]       = useState('');
  const [chatTyping, setChatTyping]     = useState(false);
  const chatEndRef                      = useRef(null);

  useEffect(() => {
    Promise.all([
      aiHubApi.getContext().then(r => {
        setContext(r.data.data);
        if (r.data.data.skills) setSkills(r.data.data.skills);
        if (r.data.data.targetRole) setTargetRole(r.data.data.targetRole);
      }).catch(() => {}),
      aiHubApi.getReadiness().then(r =>
        setReadiness(r.data.data)).catch(() => {}),
    ]);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatTyping]);

  const loadActiveResume = useCallback(async () => {
    setLoadingAR(true);
    try {
      const res = await aiHubApi.getActiveResumeText();
      setActiveResume(res.data.data);
      setResumeText(res.data.data.text);
    } catch {
      toast.error('No active resume found. Please upload one in Resume Studio.');
    } finally {
      setLoadingAR(false);
    }
  }, []);

  useEffect(() => {
    if (mode === 'resume' || mode === 'ats') {
      if (context?.activeResumeId && resumeInputMode === 'active') {
        loadActiveResume();
      }
    }
  }, [mode, resumeInputMode]);

  // ── Initialize chat with greeting ────────────────────────────
  useEffect(() => {
    if (mode === 'chat' && chatMessages.length === 0) {
      const name = user?.name?.split(' ')[0] || 'there';
      setChatMessages([{
        id:      Date.now(),
        role:    'assistant',
        content: `Hi ${name}! 👋 I'm your CareerPilot AI Career Coach.\n\nI have access to your profile, skills, and career goals. Ask me anything about:\n\n• **Resume improvement**\n• **Interview preparation**\n• **Skill development**\n• **Company-specific prep**\n• **Career guidance**\n\nWhat would you like to work on today?`,
        time:    new Date().toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' }),
      }]);
    }
  }, [mode]);

  // ── EXECUTE MODE ─────────────────────────────────────────────
  const executeMode = async (overrideMode) => {
    const activeMode = overrideMode || mode;
    setLoading(true);
    setResult(null);
    setXpEarned(0);

    try {
      let res;

      if (activeMode === 'resume') {
        if (!resumeText.trim()) {
          toast.error('Please provide resume text');
          return;
        }
        res = await aiHubApi.analyzeResume({
          resumeText,
          jobDescription: jobDesc || undefined,
        });
        setResult({ type: 'resume', data: res.data.data });
        setXpEarned(15);
      }

      else if (activeMode === 'ats') {
        if (!resumeText.trim()) {
          toast.error('Please provide resume text');
          return;
        }
        res = await aiHubApi.atsScamText({
          resumeText,
          jobDescription: jobDesc || undefined,
        });
        setResult({ type: 'ats', data: res.data.data });
        setXpEarned(10);
      }

      else if (activeMode === 'questions') {
        if (!jobDesc.trim()) {
          toast.error('Please describe the job role');
          return;
        }
        res = await aiHubApi.generateQuestions({
          jobDescription:  jobDesc,
          jobRole:         targetRole || 'Software Engineer',
          experienceLevel: 'Fresher',
          questionCount:   qCount,
        });
        setResult({ type: 'questions', data: res.data.data });
        setXpEarned(15);
      }

      else if (activeMode === 'skillgap') {
        if (!currentSkills.trim() || !jobDesc.trim()) {
          toast.error('Please provide skills and job description');
          return;
        }
        res = await aiHubApi.skillGap({
          jobDescription: jobDesc,
          currentSkills,
          targetRole: targetRole || undefined,
        });
        setResult({ type: 'skillgap', data: res.data.data });
        setXpEarned(10);
      }

      else if (activeMode === 'company') {
        if (!targetCompany) {
          toast.error('Please select a target company');
          return;
        }
        res = await aiHubApi.companyPrep({ targetCompany });
        setResult({ type: 'company', data: res.data.data.companyPrep });
        setXpEarned(20);
      }

      else if (activeMode === 'placement') {
        if (!targetRole.trim()) {
          toast.error('Please enter a target role');
          return;
        }
        res = await aiHubApi.placementPrep({
          targetRole,
          jobDescription: jobDesc || '',
        });
        setResult({ type: 'placement', data: res.data.data });
        setXpEarned(15);
      }

      else if (activeMode === 'roadmap') {
        navigate('/roadmap');
        return;
      }

      toast.success('Analysis complete! ✨');

    } catch (err) {
      toast.error(err.response?.data?.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  // ── CHAT ─────────────────────────────────────────────────────
  const handleChat = async (text) => {
    const content = text || chatInput.trim();
    if (!content || chatTyping) return;
    setChatInput('');

    const userMsg = {
      id:   Date.now(),
      role: 'user',
      content,
      time: new Date().toLocaleTimeString('en-IN', {
        hour:'2-digit', minute:'2-digit'
      }),
    };

    const updated = [...chatMessages, userMsg];
    setChatMessages(updated);
    setChatTyping(true);

    try {
      const apiMsgs = updated.map(m => ({
        role: m.role, content: m.content
      }));
      const res = await aiHubApi.chat({ messages: apiMsgs });
      setChatMessages(prev => [...prev, {
        id:      Date.now()+1,
        role:    'assistant',
        content: res.data.data.message,
        time:    new Date().toLocaleTimeString('en-IN', {
          hour:'2-digit', minute:'2-digit'
        }),
      }]);
    } catch {
      toast.error('Chat failed. Please try again.');
    } finally {
      setChatTyping(false);
    }
  };

  // ── COPY RESULT ──────────────────────────────────────────────
  const handleCopy = () => {
    const text = JSON.stringify(result?.data, null, 2);
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <div className="space-y-6 max-w-6xl">

      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            🤖 CareerPilot AI Hub
          </h2>
          <p className="text-gray-500 text-sm mt-0.5">
            Your intelligent career mentor — powered by AI
          </p>
        </div>
        {mode && (
          <button
            onClick={() => {
              setMode(null);
              setResult(null);
              setXpEarned(0);
            }}
            className="px-4 py-2 border border-gray-300 text-gray-600
                       text-sm rounded-xl hover:bg-gray-50 transition-colors">
            ← Back to Hub
          </button>
        )}
      </div>

      {/* ── Personalized Welcome Card ─────────────────────────── */}
      {!mode && (
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700
                        rounded-2xl p-6 text-white">
          <div className="flex items-start justify-between
                          flex-wrap gap-4">
            <div>
              <p className="text-white/70 text-sm mb-1">
                Welcome back
              </p>
              <h3 className="text-xl font-bold">
                👋 {firstName}!
              </h3>
              {context?.targetRole && (
                <p className="text-white/80 text-sm mt-1">
                  Working towards: {context.targetRole}
                </p>
              )}
              <p className="text-white/70 text-sm mt-3 italic">
                "Every day you practice is a day closer to your dream job."
              </p>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Career Readiness',
                  value: readiness
                    ? `${readiness.overallReadiness}%` : '—' },
                { label: 'Resume ATS',
                  value: readiness?.atsScore > 0
                    ? `${readiness.atsScore}/100` : 'Not scanned' },
                { label: 'Active Resume',
                  value: context?.activeResumeLabel
                    ? `v${context.activeResumeVersion}` : 'None' },
                { label: 'Profile',
                  value: context ? 'Loaded ✓' : 'Loading...' },
              ].map(s => (
                <div key={s.label}
                     className="bg-white/15 backdrop-blur-sm
                                rounded-xl p-3 text-center">
                  <p className="text-white font-bold text-sm">
                    {s.value}
                  </p>
                  <p className="text-white/70 text-xs">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Career Readiness Bar */}
          {readiness && (
            <div className="mt-4">
              <div className="flex justify-between text-xs
                              text-white/70 mb-1">
                <span>Career Readiness</span>
                <span>{readiness.overallReadiness}%</span>
              </div>
              <div className="w-full h-2 bg-white/20 rounded-full
                              overflow-hidden">
                <div
                  className="h-full bg-white rounded-full
                             transition-all duration-700"
                  style={{
                    width: `${readiness.overallReadiness}%`
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Mode Selection (Hub Home) ────────────────────────── */}
      {!mode && (
        <>
          {/* AI Feature Cards */}
          <div>
            <h3 className="text-sm font-bold text-gray-700
                           uppercase tracking-wider mb-3">
              🚀 AI Features
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {MODES.map(m => (
                <button
                  key={m.id}
                  onClick={() => {
                    setMode(m.id);
                    setResult(null);
                    setXpEarned(0);
                  }}
                  className={`p-4 rounded-2xl border-2 text-left
                    transition-all hover:shadow-md hover:-translate-y-0.5
                    ${MODE_COLORS[m.color]}`}>
                  <div className="text-2xl mb-2">{m.icon}</div>
                  <p className="text-sm font-bold">{m.label}</p>
                  <p className="text-xs opacity-75 mt-0.5 leading-relaxed">
                    {m.desc}
                  </p>
                  <div className="mt-2 text-xs font-bold opacity-90">
                    +{m.xp} XP
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Suggested Prompts */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-3">
              ✨ Suggested Prompts
            </h3>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_PROMPTS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setMode('chat');
                    setTimeout(() => handleChat(
                      p.replace(/^[✨🎯🔥🏢📊🗺️🚀💡]\s*/, '')), 100);
                  }}
                  className="px-3 py-2 bg-indigo-50 border
                             border-indigo-200 text-indigo-700
                             text-xs rounded-xl hover:bg-indigo-100
                             transition-colors">
                  {p}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── Active Mode View ─────────────────────────────────── */}
      {mode && (
        <div className="space-y-5">

          {/* Mode Header */}
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center
              justify-center text-xl border-2
              ${MODE_COLORS[MODES.find(m=>m.id===mode)?.color || 'indigo']}`}>
              {MODES.find(m => m.id === mode)?.icon}
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                {MODES.find(m => m.id === mode)?.label}
              </h3>
              <p className="text-xs text-gray-500">
                {MODES.find(m => m.id === mode)?.desc}
              </p>
            </div>
          </div>

          {/* Loading Screen */}
          {loading && <LoadingScreen mode={mode}/>}

          {/* XP Banner */}
          {xpEarned > 0 && !loading && (
            <div className="flex justify-center">
              <XpBadge xp={xpEarned}/>
            </div>
          )}

          {/* ── RESUME / ATS Input ──────────────────────────── */}
          {!loading && !result
           && (mode === 'resume' || mode === 'ats') && (
            <div className="space-y-4">

              {/* Resume Input Mode */}
              <div className="bg-white rounded-2xl border
                              border-gray-200 p-5 space-y-4">
                <h4 className="text-sm font-bold text-gray-900">
                  Resume Source
                </h4>
                <div className="flex gap-2">
                  {[
                    { id: 'active', label: 'Active Resume',  icon: '📄' },
                    { id: 'paste',  label: 'Paste Text',     icon: '✏️' },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setResMode(opt.id)}
                      className={`px-4 py-2 rounded-xl text-sm
                        font-medium border transition-colors flex
                        items-center gap-2
                        ${resumeInputMode === opt.id
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-gray-600 border-gray-300'
                              + ' hover:bg-gray-50'}`}>
                      {opt.icon} {opt.label}
                    </button>
                  ))}
                </div>

                {resumeInputMode === 'active' ? (
                  context?.activeResumeId ? (
                    <div className="p-4 bg-indigo-50 border
                                    border-indigo-200 rounded-xl">
                      {loadingActiveResume ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2
                                          border-indigo-500
                                          border-t-transparent
                                          rounded-full animate-spin"/>
                          <span className="text-sm text-indigo-700">
                            Loading active resume...
                          </span>
                        </div>
                      ) : activeResumeData ? (
                        <>
                          <p className="text-sm font-bold text-indigo-800">
                            ✅ {activeResumeData.label}
                          </p>
                          <p className="text-xs text-indigo-600">
                            Version {activeResumeData.version} ·
                            Text extracted successfully
                          </p>
                        </>
                      ) : (
                        <button
                          onClick={loadActiveResume}
                          className="text-sm text-indigo-700
                                     hover:underline">
                          Load Active Resume →
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 bg-amber-50 border
                                    border-amber-200 rounded-xl">
                      <p className="text-sm text-amber-700">
                        No active resume found.
                      </p>
                      <button
                        onClick={() => navigate('/resume')}
                        className="text-xs text-amber-700
                                   hover:underline font-medium">
                        Upload in Resume Studio →
                      </button>
                    </div>
                  )
                ) : (
                  <textarea
                    value={resumeText}
                    onChange={e => setResumeText(e.target.value)}
                    rows={8}
                    placeholder="Paste your complete resume text here..."
                    className="w-full px-3 py-2.5 rounded-xl border
                               border-gray-300 text-sm focus:outline-none
                               focus:ring-2 focus:ring-indigo-500
                               resize-none font-mono"
                  />
                )}
              </div>

              {/* Optional JD */}
              <div className="bg-white rounded-2xl border
                              border-gray-200 p-5">
                <label className="block text-sm font-medium
                                   text-gray-700 mb-2">
                  Target Job Description
                  <span className="text-gray-400 font-normal ml-1">
                    (optional — improves analysis)
                  </span>
                </label>
                <textarea
                  value={jobDesc}
                  onChange={e => setJobDesc(e.target.value)}
                  rows={3}
                  placeholder="Paste JD for targeted analysis..."
                  className="w-full px-3 py-2.5 rounded-xl border
                             border-gray-300 text-sm focus:outline-none
                             focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <button
                onClick={() => executeMode()}
                disabled={!resumeText.trim()}
                className="w-full py-3 bg-gradient-to-r from-indigo-600
                           to-purple-600 text-white font-bold rounded-2xl
                           transition-all hover:opacity-90
                           disabled:opacity-50 flex items-center
                           justify-center gap-2">
                {mode === 'resume'
                  ? '📄 Analyze Resume'
                  : '🎯 Run ATS Scan'}
              </button>
            </div>
          )}

          {/* ── QUESTIONS Input ──────────────────────────────── */}
          {!loading && !result && mode === 'questions' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border
                              border-gray-200 p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium
                                       text-gray-700 mb-1">
                      Job Role
                    </label>
                    <input
                      value={targetRole}
                      onChange={e => setTargetRole(e.target.value)}
                      placeholder="Software Engineer"
                      className="w-full px-3 py-2 rounded-xl border
                                 border-gray-300 text-sm focus:outline-none
                                 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium
                                       text-gray-700 mb-1">
                      Interview Type
                    </label>
                    <select
                      value={interviewType}
                      onChange={e => setIntType(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border
                                 border-gray-300 text-sm focus:outline-none
                                 focus:ring-2 focus:ring-indigo-500">
                      {INTERVIEW_TYPES.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium
                                     text-gray-700 mb-2">
                    Questions: {qCount}
                  </label>
                  <input
                    type="range" min={3} max={20} step={1}
                    value={qCount}
                    onChange={e => setQCount(parseInt(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium
                                     text-gray-700 mb-1">
                    Job Description *
                  </label>
                  <textarea
                    value={jobDesc}
                    onChange={e => setJobDesc(e.target.value)}
                    rows={4}
                    placeholder="Describe the role or paste JD..."
                    className="w-full px-3 py-2.5 rounded-xl border
                               border-gray-300 text-sm focus:outline-none
                               focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>

                <button
                  onClick={() => executeMode()}
                  disabled={!jobDesc.trim()}
                  className="w-full py-3 bg-gradient-to-r from-purple-600
                             to-indigo-600 text-white font-bold rounded-2xl
                             transition-all hover:opacity-90
                             disabled:opacity-50 flex items-center
                             justify-center gap-2">
                  🎤 Generate {qCount} Questions
                </button>
              </div>
            </div>
          )}

          {/* ── SKILL GAP Input ──────────────────────────────── */}
          {!loading && !result && mode === 'skillgap' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border
                              border-gray-200 p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium
                                     text-gray-700 mb-1">
                    Your Current Skills *
                  </label>
                  <input
                    value={currentSkills}
                    onChange={e => setSkills(e.target.value)}
                    placeholder="Java, Spring Boot, React, MySQL..."
                    className="w-full px-3 py-2 rounded-xl border
                               border-gray-300 text-sm focus:outline-none
                               focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium
                                     text-gray-700 mb-1">
                    Target Role
                  </label>
                  <input
                    value={targetRole}
                    onChange={e => setTargetRole(e.target.value)}
                    placeholder="Full Stack Developer"
                    className="w-full px-3 py-2 rounded-xl border
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
                    value={jobDesc}
                    onChange={e => setJobDesc(e.target.value)}
                    rows={4}
                    placeholder="Paste the job description..."
                    className="w-full px-3 py-2.5 rounded-xl border
                               border-gray-300 text-sm focus:outline-none
                               focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>
                <button
                  onClick={() => executeMode()}
                  disabled={!currentSkills.trim() || !jobDesc.trim()}
                  className="w-full py-3 bg-gradient-to-r from-amber-500
                             to-orange-500 text-white font-bold rounded-2xl
                             transition-all hover:opacity-90
                             disabled:opacity-50">
                  📊 Analyze Skill Gap
                </button>
              </div>
            </div>
          )}

          {/* ── COMPANY PREP Input ───────────────────────────── */}
          {!loading && !result && mode === 'company' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border
                              border-gray-200 p-5 space-y-4">
                <h4 className="text-sm font-bold text-gray-900">
                  Select Target Company
                </h4>
                <div className="flex flex-wrap gap-2">
                  {COMPANIES.map(c => (
                    <button
                      key={c}
                      onClick={() => setTargetCompany(c)}
                      className={`px-3 py-1.5 rounded-full text-sm
                        font-medium border transition-colors
                        ${targetCompany === c
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-gray-600 border-gray-300'
                              + ' hover:border-indigo-300'}`}>
                      {c}
                    </button>
                  ))}
                </div>
                {targetCompany && (
                  <div className="p-3 bg-indigo-50 border border-indigo-200
                                  rounded-xl text-sm text-indigo-700">
                    Preparing company guide for{' '}
                    <strong>{targetCompany}</strong>
                  </div>
                )}
                <button
                  onClick={() => executeMode()}
                  disabled={!targetCompany}
                  className="w-full py-3 bg-gradient-to-r from-red-600
                             to-red-700 text-white font-bold rounded-2xl
                             transition-all hover:opacity-90
                             disabled:opacity-50">
                  🏢 Generate {targetCompany} Guide
                </button>
              </div>
            </div>
          )}

          {/* ── PLACEMENT PREP Input ─────────────────────────── */}
          {!loading && !result && mode === 'placement' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border
                              border-gray-200 p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium
                                     text-gray-700 mb-1">
                    Target Role *
                  </label>
                  <input
                    value={targetRole}
                    onChange={e => setTargetRole(e.target.value)}
                    placeholder="Software Engineer"
                    className="w-full px-3 py-2 rounded-xl border
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
                    value={jobDesc}
                    onChange={e => setJobDesc(e.target.value)}
                    rows={3}
                    placeholder="Add JD for targeted preparation..."
                    className="w-full px-3 py-2.5 rounded-xl border
                               border-gray-300 text-sm focus:outline-none
                               focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>
                <button
                  onClick={() => executeMode()}
                  disabled={!targetRole.trim()}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600
                             to-purple-600 text-white font-bold rounded-2xl
                             transition-all hover:opacity-90
                             disabled:opacity-50">
                  🚀 Generate Placement Strategy
                </button>
              </div>
            </div>
          )}

          {/* ── CHAT Mode ────────────────────────────────────── */}
          {!loading && mode === 'chat' && (
            <div className="flex flex-col h-[65vh] bg-white
                            rounded-2xl border border-gray-200
                            overflow-hidden">

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex gap-3
                      ${msg.role === 'user'
                          ? 'justify-end' : ''}`}>
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full
                                      bg-gradient-to-br from-indigo-500
                                      to-purple-600 flex items-center
                                      justify-center text-white text-xs
                                      font-bold shrink-0 mt-0.5">
                        AI
                      </div>
                    )}
                    <div className={`max-w-2xl px-4 py-3 rounded-2xl
                      text-sm leading-relaxed
                      ${msg.role === 'user'
                          ? 'bg-indigo-600 text-white rounded-tr-sm'
                          : 'bg-gray-100 text-gray-800 rounded-tl-sm'}`}>
                      {msg.content.split('\n').map((line, i) => {
                        const bold = line.replace(
                          /\*\*(.*?)\*\*/g,
                          '<strong>$1</strong>');
                        return (
                          <p key={i}
                             className={line.trim() === '' ? 'h-2' : ''}
                             dangerouslySetInnerHTML={{__html: bold}}/>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {chatTyping && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br
                                    from-indigo-500 to-purple-600 flex
                                    items-center justify-center text-white
                                    text-xs font-bold">
                      AI
                    </div>
                    <div className="bg-gray-100 px-4 py-3 rounded-2xl
                                    rounded-tl-sm">
                      <div className="flex gap-1.5">
                        {[0,1,2].map(i => (
                          <div key={i}
                               className="w-2 h-2 bg-indigo-400
                                          rounded-full animate-bounce"
                               style={{animationDelay:`${i*0.15}s`}}/>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef}/>
              </div>

              {/* Suggested prompts for chat */}
              {chatMessages.length <= 1 && (
                <div className="px-4 py-2 border-t border-gray-100">
                  <div className="flex gap-2 flex-wrap">
                    {SUGGESTED_PROMPTS.slice(0,4).map((p, i) => (
                      <button
                        key={i}
                        onClick={() => handleChat(
                          p.replace(/^[✨🎯🔥🏢📊🗺️🚀💡]\s*/,''))}
                        className="px-3 py-1.5 bg-indigo-50
                                   border border-indigo-200
                                   text-indigo-700 rounded-full text-xs
                                   hover:bg-indigo-100 transition-colors">
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Bar */}
              <div className="border-t border-gray-200 p-3">
                <div className="flex gap-2">
                  <textarea
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleChat();
                      }
                    }}
                    placeholder="Ask me anything about your career..."
                    rows={1}
                    style={{ resize: 'none' }}
                    className="flex-1 px-4 py-2.5 rounded-xl border
                               border-gray-300 text-sm focus:outline-none
                               focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={() => handleChat()}
                    disabled={!chatInput.trim() || chatTyping}
                    className="w-11 h-11 bg-indigo-600 text-white
                               rounded-xl flex items-center justify-center
                               hover:bg-indigo-700 transition-colors
                               disabled:opacity-50">
                    {chatTyping ? (
                      <div className="w-4 h-4 border-2 border-white
                                      border-t-transparent rounded-full
                                      animate-spin"/>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24"
                           fill="none" stroke="currentColor"
                           strokeWidth="2.5" strokeLinecap="round">
                        <line x1="22" y1="2" x2="11" y2="13"/>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── RESULTS ──────────────────────────────────────── */}
          {!loading && result && (
            <div className="space-y-4">

              {/* Result Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900">
                  ✅ Analysis Complete
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    className="px-3 py-1.5 border border-gray-300
                               text-gray-600 text-xs rounded-lg
                               hover:bg-gray-50 transition-colors">
                    📋 Copy
                  </button>
                  <button
                    onClick={() => {
                      setResult(null);
                      setXpEarned(0);
                    }}
                    className="px-3 py-1.5 border border-gray-300
                               text-gray-600 text-xs rounded-lg
                               hover:bg-gray-50 transition-colors">
                    🔄 Redo
                  </button>
                </div>
              </div>

              {/* Resume Analysis Result */}
              {result.type === 'resume' && result.data && (
                <div className="space-y-4">
                  <div className="bg-white rounded-2xl border
                                  border-gray-200 p-6">
                    <div className="flex items-center gap-6 mb-5">
                      <div className="text-center">
                        <p className={`text-4xl font-bold
                          ${result.data.atsScore >= 70
                              ? 'text-green-600'
                              : result.data.atsScore >= 50
                                ? 'text-amber-600'
                                : 'text-red-600'}`}>
                          {result.data.atsScore}
                        </p>
                        <p className="text-xs text-gray-500">
                          ATS Score
                        </p>
                      </div>
                      <div>
                        <span className={`px-3 py-1 rounded-full
                          text-sm font-bold
                          ${result.data.atsScore >= 70
                              ? 'bg-green-100 text-green-700'
                              : result.data.atsScore >= 50
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-red-100 text-red-700'}`}>
                          {result.data.scoreLabel}
                        </span>
                        <p className="text-sm text-gray-600 mt-2
                                      max-w-md">
                          {result.data.overallFeedback}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FeedbackSection
                        title="✅ Strengths"
                        items={result.data.strengths}
                        color="green"/>
                      <FeedbackSection
                        title="⚠️ Weaknesses"
                        items={result.data.weaknesses}
                        color="red"/>
                      <FeedbackSection
                        title="🔑 Missing Keywords"
                        items={result.data.missingKeywords}
                        color="amber"/>
                      <FeedbackSection
                        title="💡 Suggestions"
                        items={result.data.improvementSuggestions}
                        color="blue"/>
                    </div>
                  </div>
                </div>
              )}

              {/* ATS Result */}
              {result.type === 'ats' && result.data && (
                <div className="bg-white rounded-2xl border
                                border-gray-200 p-6 space-y-5">
                  {/* Score */}
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className={`text-5xl font-bold
                        ${result.data.atsScore >= 70
                            ? 'text-green-600'
                            : result.data.atsScore >= 50
                              ? 'text-amber-600'
                              : 'text-red-600'}`}>
                        {result.data.atsScore}
                      </p>
                      <p className="text-xs text-gray-500">/ 100</p>
                    </div>
                    <div className="flex-1">
                      <span className={`px-3 py-1 rounded-full
                        text-sm font-bold
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

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      {l:'Keywords Found', v: result.data.foundKeywords?.length || 0, c:'green'},
                      {l:'Missing Keywords', v: result.data.missingKeywords?.length || 0, c:'red'},
                      {l:'Quick Wins', v: result.data.quickWins?.length || 0, c:'indigo'},
                    ].map(s => (
                      <div key={s.l}
                           className="text-center p-3 bg-gray-50
                                      rounded-xl border border-gray-200">
                        <p className={`text-2xl font-bold
                          text-${s.c}-600`}>{s.v}</p>
                        <p className="text-xs text-gray-500">{s.l}</p>
                      </div>
                    ))}
                  </div>

                  {/* Sections */}
                  {result.data.sectionScores?.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold text-gray-900">
                        Section Scores
                      </h4>
                      {result.data.sectionScores.map((s, i) => (
                        <ScoreBar key={i} label={s.section}
                                  score={s.score}/>
                      ))}
                    </div>
                  )}

                  {/* Quick Wins */}
                  {result.data.quickWins?.length > 0 && (
                    <div className="bg-indigo-50 border border-indigo-200
                                    rounded-xl p-4">
                      <h4 className="text-sm font-bold text-indigo-900 mb-3">
                        ⚡ Quick Wins
                      </h4>
                      <div className="space-y-2">
                        {result.data.quickWins.map((w, i) => (
                          <div key={i} className="flex gap-2 bg-white
                                                  rounded-lg p-2.5">
                            <span className="text-indigo-600 font-bold
                                             shrink-0">{i+1}.</span>
                            <p className="text-sm text-gray-700">{w}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Keywords */}
                  <div className="grid grid-cols-2 gap-4">
                    {result.data.foundKeywords?.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-gray-600
                                      uppercase mb-2">
                          ✅ Found
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {result.data.foundKeywords.map((k,i) => (
                            <span key={i} className="px-2 py-0.5
                              bg-green-50 text-green-700 rounded
                              text-xs border border-green-200">
                              {k}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {result.data.missingKeywords?.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-gray-600
                                      uppercase mb-2">
                          ❌ Missing
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {result.data.missingKeywords.map((k,i) => (
                            <span key={i} className="px-2 py-0.5
                              bg-red-50 text-red-700 rounded
                              text-xs border border-red-200">
                              {k}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Interview Questions Result */}
              {result.type === 'questions' && result.data && (
                <div className="space-y-4">
                  {[
                    { title: '⚙️ Technical',     qs: result.data.technicalQuestions   },
                    { title: '🧠 Behavioural',   qs: result.data.behaviouralQuestions },
                    { title: '💼 HR',            qs: result.data.hrQuestions          },
                  ].filter(s => s.qs?.length).map(s => (
                    <div key={s.title}
                         className="bg-white rounded-2xl border
                                    border-gray-200 p-5">
                      <h4 className="text-sm font-bold text-gray-900 mb-3">
                        {s.title} Questions
                      </h4>
                      <div className="space-y-3">
                        {s.qs.map((q, i) => (
                          <div key={i}
                               className="p-3 bg-gray-50 rounded-xl">
                            <div className="flex justify-between gap-2 mb-1">
                              <p className="text-sm font-medium text-gray-900">
                                {i+1}. {q.question}
                              </p>
                              <span className={`px-2 py-0.5 rounded text-xs
                                font-medium shrink-0
                                ${q.difficulty === 'Easy'
                                    ? 'bg-green-100 text-green-700'
                                    : q.difficulty === 'Hard'
                                      ? 'bg-red-100 text-red-700'
                                      : 'bg-amber-100 text-amber-700'}`}>
                                {q.difficulty}
                              </span>
                            </div>
                            {q.hint && (
                              <p className="text-xs text-gray-500
                                            pl-3 border-l-2 border-gray-300">
                                💡 {q.hint}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={() => navigate('/interview-practice')}
                    className="w-full py-3 bg-indigo-600 text-white
                               font-medium rounded-xl hover:bg-indigo-700
                               transition-colors">
                    🎤 Practice These Questions in AI Interview →
                  </button>
                </div>
              )}

              {/* Skill Gap Result */}
              {result.type === 'skillgap' && result.data && (
                <div className="space-y-4">
                  <div className="bg-white rounded-2xl border
                                  border-gray-200 p-6">
                    <div className="flex items-center gap-4 mb-5">
                      <div className="text-center">
                        <p className={`text-4xl font-bold
                          ${result.data.matchPercentage >= 70
                              ? 'text-green-600'
                              : result.data.matchPercentage >= 40
                                ? 'text-amber-600'
                                : 'text-red-600'}`}>
                          {result.data.matchPercentage}%
                        </p>
                        <p className="text-xs text-gray-500">Match</p>
                      </div>
                      <p className="text-sm text-gray-600 flex-1">
                        {result.data.summary}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <FeedbackSection
                        title="✅ You Have"
                        items={result.data.presentSkills}
                        color="green"/>
                      <FeedbackSection
                        title="❌ Missing"
                        items={result.data.missingSkills}
                        color="red"/>
                      <FeedbackSection
                        title="⭐ Nice to Have"
                        items={result.data.niceToHaveSkills}
                        color="amber"/>
                    </div>

                    {result.data.learningPath?.length > 0 && (
                      <div className="mt-5">
                        <h4 className="text-sm font-bold text-gray-900 mb-3">
                          📚 Learning Path
                        </h4>
                        <div className="space-y-2">
                          {result.data.learningPath.map((lp, i) => (
                            <div key={i}
                                 className="flex items-start gap-3 p-3
                                            bg-indigo-50 rounded-xl">
                              <span className="w-6 h-6 rounded-full
                                bg-indigo-600 text-white text-xs
                                font-bold flex items-center justify-center
                                shrink-0">
                                {i+1}
                              </span>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {lp.skill}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {lp.suggestedResource}
                                  {lp.estimatedTime && ` · ${lp.estimatedTime}`}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Company Prep Result */}
              {result.type === 'company' && result.data && (
                <div className="space-y-4">
                  <div className="bg-white rounded-2xl border
                                  border-gray-200 p-6">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-12 h-12 rounded-xl bg-red-50
                                      flex items-center justify-center
                                      text-2xl border border-red-200">
                        🏢
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-gray-900">
                          {result.data.company} Interview Guide
                        </h4>
                        <p className="text-sm text-gray-500">
                          {result.data.salaryRange}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <CompanySection
                        title="📋 Hiring Process"
                        content={result.data.hiringProcess}/>
                      <CompanySection
                        title="🎯 Interview Pattern"
                        content={result.data.interviewPattern}/>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <ListSection
                        title="❓ Frequent Questions"
                        items={result.data.frequentQuestions}
                        color="blue"/>
                      <ListSection
                        title="💻 DSA Topics"
                        items={result.data.dsaTopics}
                        color="purple"/>
                      <ListSection
                        title="🎭 Behavioral Questions"
                        items={result.data.behavioralQuestions}
                        color="amber"/>
                      <ListSection
                        title="🚀 Preparation Strategy"
                        items={result.data.preparationStrategy}
                        color="green"/>
                    </div>

                    {result.data.commonMistakes?.length > 0 && (
                      <div className="mt-4 bg-red-50 border border-red-200
                                      rounded-xl p-4">
                        <h5 className="text-sm font-bold text-red-800 mb-2">
                          ⚠️ Common Mistakes to Avoid
                        </h5>
                        <ul className="space-y-1">
                          {result.data.commonMistakes.map((m, i) => (
                            <li key={i} className="text-xs text-red-700
                                                   flex gap-2">
                              <span>•</span>{m}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Placement Prep Result */}
              {result.type === 'placement' && result.data && (
                <div className="bg-white rounded-2xl border
                                border-gray-200 p-6">
                  <h4 className="text-sm font-bold text-gray-900 mb-4">
                    🚀 30-Day Placement Strategy
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
      )}
    </div>
  );
}

// ── Helper Components ─────────────────────────────────────────────

function FeedbackSection({ title, items, color }) {
  const c = {
    green:  'bg-green-50  text-green-700',
    red:    'bg-red-50    text-red-700',
    amber:  'bg-amber-50  text-amber-700',
    blue:   'bg-blue-50   text-blue-700',
    purple: 'bg-purple-50 text-purple-700',
    indigo: 'bg-indigo-50 text-indigo-700',
  };
  const dot = {
    green: 'bg-green-400', red: 'bg-red-400',
    amber: 'bg-amber-400', blue: 'bg-blue-400',
    purple: 'bg-purple-400', indigo: 'bg-indigo-400',
  };
  if (!items?.length) return null;
  return (
    <div className={`p-4 rounded-xl ${c[color]}`}>
      <p className="text-xs font-bold uppercase tracking-wider mb-2">
        {title}
      </p>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-xs">
            <span className={`w-1.5 h-1.5 rounded-full mt-1.5
                              shrink-0 ${dot[color]}`}/>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CompanySection({ title, content }) {
  return (
    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
      <p className="text-xs font-bold text-gray-700 mb-2">{title}</p>
      <p className="text-sm text-gray-600 leading-relaxed">{content}</p>
    </div>
  );
}

function ListSection({ title, items, color }) {
  const bg = {
    blue:   'bg-blue-50   border-blue-200',
    purple: 'bg-purple-50 border-purple-200',
    amber:  'bg-amber-50  border-amber-200',
    green:  'bg-green-50  border-green-200',
  };
  const text = {
    blue:   'text-blue-700',
    purple: 'text-purple-700',
    amber:  'text-amber-700',
    green:  'text-green-700',
  };
  if (!items?.length) return null;
  return (
    <div className={`p-4 rounded-xl border ${bg[color]}`}>
      <p className={`text-xs font-bold uppercase mb-2 ${text[color]}`}>
        {title}
      </p>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className={`text-xs flex gap-2 ${text[color]}`}>
            <span>•</span>{item}
          </li>
        ))}
      </ul>
    </div>
  );
}

