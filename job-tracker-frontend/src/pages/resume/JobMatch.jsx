import { useState, useRef } from 'react';
import { jobMatchApi } from '../../api/jobMatchApi';
import toast from 'react-hot-toast';

const RECOMMENDATION_STYLES = {
  'Apply now':     'bg-green-100  text-green-800  border-green-300',
  'Improve first': 'bg-amber-100  text-amber-800  border-amber-300',
  'Not ready':     'bg-red-100    text-red-800    border-red-300',
};

const RECOMMENDATION_ICONS = {
  'Apply now':     '🚀',
  'Improve first': '⚠️',
  'Not ready':     '🛑',
};

const MATCH_COLORS = {
  'Strong Match': { ring: '#22c55e', badge: 'bg-green-100 text-green-700', bar: 'bg-green-500' },
  'Good Match':   { ring: '#3b82f6', badge: 'bg-blue-100  text-blue-700',  bar: 'bg-blue-500'  },
  'Fair Match':   { ring: '#f59e0b', badge: 'bg-amber-100 text-amber-700', bar: 'bg-amber-500' },
  'Weak Match':   { ring: '#f97316', badge: 'bg-orange-100 text-orange-700',bar: 'bg-orange-500'},
  'Poor Match':   { ring: '#ef4444', badge: 'bg-red-100   text-red-700',   bar: 'bg-red-500'   },
};

export default function JobMatch() {
  const [inputMode, setInputMode] = useState('text');
  const [resumeText, setResumeText] = useState('');
  const [jobDesc, setJobDesc]       = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [expLevel, setExpLevel]     = useState('Fresher');
  const [file, setFile]             = useState(null);
  const [analyzing, setAnalyzing]   = useState(false);
  const [result, setResult]         = useState(null);
  const [dragOver, setDragOver]     = useState(false);
  const fileRef                     = useRef();

  const handleAnalyze = async () => {
    if (inputMode === 'text' && !resumeText.trim()) {
      toast.error('Please paste your resume text');
      return;
    }
    if (inputMode === 'pdf' && !file) {
      toast.error('Please upload your resume PDF');
      return;
    }
    if (!jobDesc.trim()) {
      toast.error('Job description is required');
      return;
    }

    setAnalyzing(true);
    setResult(null);

    try {
      let res;
      if (inputMode === 'pdf') {
        const fd = new FormData();
        fd.append('file',           file);
        fd.append('jobDescription', jobDesc);
        if (targetRole) fd.append('targetRole', targetRole);
        fd.append('experienceLevel', expLevel);
        res = await jobMatchApi.analyzePdf(fd);
      } else {
        res = await jobMatchApi.analyze({
          resumeText,
          jobDescription: jobDesc,
          targetRole:     targetRole || undefined,
          experienceLevel: expLevel,
        });
      }
      setResult(res.data.data);
      toast.success('Match analysis complete!');
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f?.name.endsWith('.pdf')) {
      setFile(f);
    } else {
      toast.error('Only PDF files accepted');
    }
  };

  const colors = result
    ? (MATCH_COLORS[result.matchLabel] || MATCH_COLORS['Poor Match'])
    : null;

  const circumference = 2 * Math.PI * 52;

  const CategoryBar = ({ label, score }) => (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-xs text-gray-600">{label}</span>
        <span className="text-xs font-semibold text-gray-800">
          {score}/100
        </span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full
                      overflow-hidden">
        <div
          className={`h-full rounded-full transition-all
                      duration-700
                      ${score >= 70 ? 'bg-green-500'
                        : score >= 50 ? 'bg-amber-500'
                        : 'bg-red-400'}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">

      {/* Input Form */}
      {!result && (
        <div className="space-y-5">

          {/* Input Mode + Role */}
          <div className="bg-white rounded-xl border
                          border-gray-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">
                Your Resume
              </h3>
              <div className="flex rounded-lg border border-gray-300
                              overflow-hidden text-xs">
                <button
                  onClick={() => setInputMode('text')}
                  className={`px-3 py-1.5 transition-colors
                    ${inputMode === 'text'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-gray-600'
                          + ' hover:bg-gray-50'}`}>
                  ✏️ Paste Text
                </button>
                <button
                  onClick={() => setInputMode('pdf')}
                  className={`px-3 py-1.5 transition-colors
                    ${inputMode === 'pdf'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-gray-600'
                          + ' hover:bg-gray-50'}`}>
                  📄 Upload PDF
                </button>
              </div>
            </div>

            {/* Text Input */}
            {inputMode === 'text' && (
              <textarea
                value={resumeText}
                onChange={e => setResumeText(e.target.value)}
                rows={8}
                placeholder="Paste your complete resume text here..."
                className="w-full px-3 py-2 rounded-lg border
                           border-gray-300 text-sm
                           focus:outline-none focus:ring-2
                           focus:ring-indigo-500 resize-none
                           font-mono"
              />
            )}

            {/* PDF Upload */}
            {inputMode === 'pdf' && (
              <div
                onDragOver={e => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current.click()}
                className={`border-2 border-dashed rounded-xl
                  p-8 text-center cursor-pointer
                  transition-colors
                  ${dragOver
                      ? 'border-indigo-400 bg-indigo-50'
                      : file
                        ? 'border-green-400 bg-green-50'
                        : 'border-gray-300'
                          + ' hover:border-indigo-300'}`}>
                <div className="text-4xl mb-2">
                  {file ? '✅' : '📄'}
                </div>
                <p className="text-sm font-medium text-gray-700">
                  {file
                    ? file.name
                    : 'Drop PDF or click to browse'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {file
                    ? `${(file.size / 1024).toFixed(0)} KB`
                    : 'PDF only · Max 5 MB'}
                </p>
                {file && (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    className="mt-2 text-xs text-red-500
                               hover:text-red-700">
                    Remove
                  </button>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={e => setFile(e.target.files[0])}
                />
              </div>
            )}
          </div>

          {/* Job Description + Options */}
          <div className="bg-white rounded-xl border
                          border-gray-200 p-6 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">
              Job Details
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium
                                   text-gray-700 mb-1">
                  Target Role
                </label>
                <input
                  value={targetRole}
                  onChange={e => setTargetRole(e.target.value)}
                  placeholder="Software Engineer"
                  className="w-full px-3 py-2 rounded-lg border
                             border-gray-300 text-sm
                             focus:outline-none focus:ring-2
                             focus:ring-indigo-500"
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
                             border-gray-300 text-sm
                             focus:outline-none focus:ring-2
                             focus:ring-indigo-500">
                  {['Fresher','1 year','2 years',
                    '3+ years','5+ years'].map(l => (
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
                value={jobDesc}
                onChange={e => setJobDesc(e.target.value)}
                rows={6}
                placeholder="Paste the full job description here..."
                className="w-full px-3 py-2 rounded-lg border
                           border-gray-300 text-sm
                           focus:outline-none focus:ring-2
                           focus:ring-indigo-500 resize-none"
              />
            </div>

            <button
              onClick={handleAnalyze}
              disabled={analyzing || !jobDesc.trim()}
              className="w-full py-3 bg-indigo-600
                         hover:bg-indigo-700 text-white
                         font-medium rounded-lg text-sm
                         transition-colors disabled:opacity-60
                         flex items-center justify-center gap-2">
              {analyzing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white
                                  border-t-transparent rounded-full
                                  animate-spin"/>
                  Analyzing match...
                </>
              ) : (
                '🔍 Analyze Job Match'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {result && colors && (
        <div className="space-y-5">

          {/* Score Header */}
          <div className="bg-white rounded-xl border
                          border-gray-200 p-6">
            <div className="flex items-center gap-8">

              {/* Score Ring */}
              <div className="shrink-0">
                <svg width="130" height="130"
                     viewBox="0 0 130 130">
                  <circle cx="65" cy="65" r="52"
                    fill="none" stroke="#f3f4f6"
                    strokeWidth="10"/>
                  <circle cx="65" cy="65" r="52"
                    fill="none"
                    stroke={colors.ring}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${
                      (result.matchScore / 100) * circumference
                    } ${circumference}`}
                    strokeDashoffset={circumference / 4}
                    style={{
                      transition: 'stroke-dasharray 1s ease'
                    }}
                  />
                  <text x="65" y="58"
                    textAnchor="middle"
                    fontSize="28"
                    fontWeight="700"
                    fill={colors.ring}>
                    {result.matchScore}%
                  </text>
                  <text x="65" y="80"
                    textAnchor="middle"
                    fontSize="11"
                    fill="#6b7280">
                    match score
                  </text>
                </svg>
              </div>

              {/* Summary */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-3 py-1 rounded-full
                    text-sm font-semibold ${colors.badge}`}>
                    {result.matchLabel}
                  </span>
                  {result.recommendation && (
                    <span className={`px-3 py-1 rounded-full
                      text-xs font-medium border
                      ${RECOMMENDATION_STYLES[
                          result.recommendation]
                        || 'bg-gray-100 text-gray-700'}`}>
                      {RECOMMENDATION_ICONS[
                          result.recommendation] || '📋'}{' '}
                      {result.recommendation}
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-700
                              leading-relaxed mb-3">
                  {result.overallFeedback}
                </p>

                {result.estimatedTimeToReady && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      ⏱ Time to ready:
                    </span>
                    <span className="text-xs font-semibold
                                     text-indigo-700">
                      {result.estimatedTimeToReady}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Category Scores */}
          <div className="bg-white rounded-xl border
                          border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900
                           mb-4">
              📊 Category Breakdown
            </h3>
            <div className="space-y-3">
              <CategoryBar label="Skills Match"
                           score={result.skillsScore}/>
              <CategoryBar label="Keywords Match"
                           score={result.keywordsScore}/>
              <CategoryBar label="Experience"
                           score={result.experienceScore}/>
              <CategoryBar label="Education"
                           score={result.educationScore}/>
              <CategoryBar label="Resume Format"
                           score={result.overallFormatScore}/>
            </div>
          </div>

          {/* Skills Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Matched Skills */}
            {result.matchedSkills?.length > 0 && (
              <div className="bg-white rounded-xl border
                              border-gray-200 p-5">
                <h3 className="text-xs font-semibold
                               text-gray-500 uppercase
                               tracking-wider mb-3">
                  ✅ Matched Skills
                  ({result.matchedSkills.length})
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {result.matchedSkills.map((s, i) => (
                    <span key={i}
                          className="px-2 py-0.5 bg-green-50
                                     text-green-700 rounded-full
                                     text-xs border
                                     border-green-200">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Partial Skills */}
            {result.partialSkills?.length > 0 && (
              <div className="bg-white rounded-xl border
                              border-gray-200 p-5">
                <h3 className="text-xs font-semibold
                               text-gray-500 uppercase
                               tracking-wider mb-3">
                  🟡 Partial Match
                  ({result.partialSkills.length})
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {result.partialSkills.map((s, i) => (
                    <span key={i}
                          className="px-2 py-0.5 bg-amber-50
                                     text-amber-700 rounded-full
                                     text-xs border
                                     border-amber-200">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Missing Skills */}
            {result.missingSkills?.length > 0 && (
              <div className="bg-white rounded-xl border
                              border-gray-200 p-5">
                <h3 className="text-xs font-semibold
                               text-gray-500 uppercase
                               tracking-wider mb-3">
                  ❌ Missing Skills
                  ({result.missingSkills.length})
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {result.missingSkills.map((s, i) => (
                    <span key={i}
                          className="px-2 py-0.5 bg-red-50
                                     text-red-700 rounded-full
                                     text-xs border
                                     border-red-200">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Keywords Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {result.matchedKeywords?.length > 0 && (
              <div className="bg-white rounded-xl border
                              border-gray-200 p-5">
                <h3 className="text-xs font-semibold
                               text-gray-500 uppercase
                               tracking-wider mb-3">
                  ✅ Keywords Found
                  ({result.matchedKeywords.length})
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {result.matchedKeywords.map((k, i) => (
                    <span key={i}
                          className="px-2 py-0.5 bg-green-50
                                     text-green-700 rounded
                                     text-xs border
                                     border-green-200">
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {result.missingKeywords?.length > 0 && (
              <div className="bg-white rounded-xl border
                              border-gray-200 p-5">
                <h3 className="text-xs font-semibold
                               text-gray-500 uppercase
                               tracking-wider mb-3">
                  ❌ Missing Keywords
                  ({result.missingKeywords.length})
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {result.missingKeywords.map((k, i) => (
                    <span key={i}
                          className="px-2 py-0.5 bg-red-50
                                     text-red-700 rounded
                                     text-xs border
                                     border-red-200">
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Experience & Education */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border
                            border-gray-200 p-5">
              <h3 className="text-xs font-semibold text-gray-500
                             uppercase tracking-wider mb-3">
                💼 Experience
              </h3>
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-0.5 rounded-full
                  text-xs font-medium
                  ${result.experienceMatch === 'Meets'
                      ? 'bg-green-100 text-green-700'
                      : result.experienceMatch === 'Exceeds'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-red-100 text-red-700'}`}>
                  {result.experienceMatch}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {result.experienceFeedback}
              </p>
            </div>

            <div className="bg-white rounded-xl border
                            border-gray-200 p-5">
              <h3 className="text-xs font-semibold text-gray-500
                             uppercase tracking-wider mb-3">
                🎓 Education
              </h3>
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-0.5 rounded-full
                  text-xs font-medium
                  ${result.educationMatch === 'Meets'
                      ? 'bg-green-100 text-green-700'
                      : result.educationMatch === 'Exceeds'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-red-100 text-red-700'}`}>
                  {result.educationMatch}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {result.educationFeedback}
              </p>
            </div>
          </div>

          {/* Top Improvements */}
          {result.topImprovements?.length > 0 && (
            <div className="bg-indigo-50 border border-indigo-200
                            rounded-xl p-5">
              <h3 className="text-sm font-semibold text-indigo-900
                             mb-3">
                🎯 Top Improvements (Ordered by Impact)
              </h3>
              <div className="space-y-2">
                {result.topImprovements.map((item, i) => (
                  <div key={i}
                       className="flex items-start gap-3
                                  bg-white rounded-lg p-3
                                  border border-indigo-100">
                    <span className="w-6 h-6 rounded-full
                      bg-indigo-600 text-white text-xs
                      font-bold flex items-center
                      justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-sm text-gray-700">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resume Tweaks & Skills to Learn */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {result.resumeTweaks?.length > 0 && (
              <div className="bg-white rounded-xl border
                              border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-900
                               mb-3">
                  ✏️ Quick Resume Tweaks
                </h3>
                <ul className="space-y-2">
                  {result.resumeTweaks.map((t, i) => (
                    <li key={i}
                        className="flex items-start gap-2
                                   text-sm text-gray-700">
                      <span className="text-amber-500
                                       shrink-0 mt-0.5">•</span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.skillsToLearn?.length > 0 && (
              <div className="bg-white rounded-xl border
                              border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-900
                               mb-3">
                  📚 Skills to Learn
                </h3>
                <ul className="space-y-2">
                  {result.skillsToLearn.map((s, i) => (
                    <li key={i}
                        className="flex items-start gap-2
                                   text-sm text-gray-700">
                      <span className="text-indigo-500
                                       shrink-0 mt-0.5">•</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Analyze Another */}
          <button
            onClick={() => setResult(null)}
            className="w-full py-2.5 border border-gray-300
                       text-gray-600 text-sm rounded-lg
                       hover:bg-gray-50 transition-colors">
            ← Analyze Another Job
          </button>
        </div>
      )}
    </div>
  );
}


