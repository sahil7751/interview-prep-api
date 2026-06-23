import { useState, useRef } from 'react';
import { atsApi } from '../../api/atsApi';
import toast from 'react-hot-toast';

const INPUT_MODES = {
  PDF:  'pdf',
  TEXT: 'text',
};

export default function AtsScanner() {
  const [mode, setMode]         = useState(INPUT_MODES.PDF);
  const [file, setFile]         = useState(null);
  const [resumeText, setText]   = useState('');
  const [jobDesc, setJobDesc]   = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult]     = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef                 = useRef();

  const handleScan = async () => {
    if (mode === INPUT_MODES.PDF && !file) {
      toast.error('Please upload a PDF resume');
      return;
    }
    if (mode === INPUT_MODES.TEXT && !resumeText.trim()) {
      toast.error('Please paste your resume text');
      return;
    }

    setScanning(true);
    setResult(null);

    try {
      let res;
      if (mode === INPUT_MODES.PDF) {
        const fd = new FormData();
        fd.append('file', file);
        if (jobDesc.trim()) fd.append('jobDescription', jobDesc);
        res = await atsApi.scanPdf(fd);
      } else {
        res = await atsApi.scanText({
          resumeText,
          jobDescription: jobDesc || undefined,
        });
      }
      setResult(res.data.data);
      toast.success('ATS scan complete!');
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Scan failed');
    } finally {
      setScanning(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && f.name.endsWith('.pdf')) {
      setFile(f);
    } else {
      toast.error('Only PDF files accepted');
    }
  };

  const scoreColor = (score) => {
    if (score >= 85) return {
      text: 'text-green-600',
      bg:   'bg-green-500',
      ring: '#22c55e',
      badge:'bg-green-100 text-green-700',
    };
    if (score >= 70) return {
      text: 'text-blue-600',
      bg:   'bg-blue-500',
      ring: '#3b82f6',
      badge:'bg-blue-100 text-blue-700',
    };
    if (score >= 50) return {
      text: 'text-amber-600',
      bg:   'bg-amber-500',
      ring: '#f59e0b',
      badge:'bg-amber-100 text-amber-700',
    };
    return {
      text: 'text-red-600',
      bg:   'bg-red-500',
      ring: '#ef4444',
      badge:'bg-red-100 text-red-700',
    };
  };



  const sectionStatusIcon = (status) => {
    if (status === 'present') return '✅';
    if (status === 'weak')    return '⚠️';
    return '❌';
  };

  const circumference = 2 * Math.PI * 52;

  return (
    <div className="space-y-6">

      {/* Input Mode Toggle */}
      <div className="bg-white rounded-xl border border-gray-200
                      p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">
            Upload Resume for ATS Analysis
          </h3>
          <div className="flex rounded-lg border border-gray-300
                          overflow-hidden text-xs">
            <button
              onClick={() => {
                setMode(INPUT_MODES.PDF);
                setResult(null);
              }}
              className={`px-3 py-1.5 transition-colors
                ${mode === INPUT_MODES.PDF
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              📄 Upload PDF
            </button>
            <button
              onClick={() => {
                setMode(INPUT_MODES.TEXT);
                setResult(null);
              }}
              className={`px-3 py-1.5 transition-colors
                ${mode === INPUT_MODES.TEXT
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              ✏️ Paste Text
            </button>
          </div>
        </div>

        {/* PDF Upload */}
        {mode === INPUT_MODES.PDF && (
          <div
            onDragOver={e => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current.click()}
            className={`border-2 border-dashed rounded-xl p-8
              text-center cursor-pointer transition-colors
              ${dragOver
                  ? 'border-indigo-400 bg-indigo-50'
                  : file
                    ? 'border-green-400 bg-green-50'
                    : 'border-gray-300 hover:border-indigo-300'}`}>
            <div className="text-4xl mb-3">
              {file ? '✅' : '📄'}
            </div>
            <p className="text-sm font-medium text-gray-700">
              {file
                ? file.name
                : 'Drop your PDF resume here or click to browse'}
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

        {/* Text Paste */}
        {mode === INPUT_MODES.TEXT && (
          <textarea
            value={resumeText}
            onChange={e => setText(e.target.value)}
            rows={10}
            placeholder="Paste your complete resume text here..."
            className="w-full px-3 py-2 rounded-lg border
                       border-gray-300 text-sm focus:outline-none
                       focus:ring-2 focus:ring-indigo-500
                       resize-none font-mono"
          />
        )}

        {/* Optional JD */}
        <div>
          <label className="block text-sm font-medium
                             text-gray-700 mb-1">
            Target Job Description
            <span className="text-gray-400 font-normal ml-1">
              (optional — improves keyword analysis)
            </span>
          </label>
          <textarea
            value={jobDesc}
            onChange={e => setJobDesc(e.target.value)}
            rows={3}
            placeholder="Paste job description for targeted keyword analysis..."
            className="w-full px-3 py-2 rounded-lg border
                       border-gray-300 text-sm focus:outline-none
                       focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>

        <button
          onClick={handleScan}
          disabled={scanning}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700
                     text-white font-medium rounded-lg text-sm
                     transition-colors disabled:opacity-60
                     flex items-center justify-center gap-2">
          {scanning ? (
            <>
              <div className="w-5 h-5 border-2 border-white
                              border-t-transparent rounded-full
                              animate-spin"/>
              Analyzing resume...
            </>
          ) : (
            '🎯 Run ATS Scan'
          )}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-5">

          {/* Score Header Card */}
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
                    stroke={scoreColor(result.atsScore).ring}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${
                      (result.atsScore / 100) * circumference
                    } ${circumference}`}
                    strokeDashoffset={circumference / 4}
                    style={{
                      transition:
                        'stroke-dasharray 1s ease'
                    }}
                  />
                  <text x="65" y="60"
                    textAnchor="middle"
                    fontSize="28"
                    fontWeight="700"
                    fill={scoreColor(result.atsScore).ring}>
                    {result.atsScore}
                  </text>
                  <text x="65" y="80"
                    textAnchor="middle"
                    fontSize="12"
                    fill="#6b7280">
                    out of 100
                  </text>
                </svg>
              </div>

              {/* Score Summary */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-3 py-1 rounded-full
                    text-sm font-semibold
                    ${scoreColor(result.atsScore).badge}`}>
                    {result.scoreLabel}
                  </span>
                  <span className="text-sm text-gray-500">
                    {result.wordCount} words ·{' '}
                    {result.keywordMatchPercent}% keyword match
                  </span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {result.overallFeedback}
                </p>

                {/* Quick stats row */}
                <div className="flex gap-4 mt-4">
                  <div className="text-center">
                    <p className="text-lg font-bold text-green-600">
                      {result.foundKeywords?.length || 0}
                    </p>
                    <p className="text-xs text-gray-500">
                      Keywords Found
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-red-500">
                      {result.missingKeywords?.length || 0}
                    </p>
                    <p className="text-xs text-gray-500">
                      Missing Keywords
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold
                                  text-amber-600">
                      {result.formattingIssues?.length || 0}
                    </p>
                    <p className="text-xs text-gray-500">
                      Format Issues
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold
                                  text-indigo-600">
                      {result.quickWins?.length || 0}
                    </p>
                    <p className="text-xs text-gray-500">
                      Quick Wins
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section Scores */}
          {result.sectionScores?.length > 0 && (
            <div className="bg-white rounded-xl border
                            border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900
                             mb-4">
                📋 Section-by-Section Analysis
              </h3>
              <div className="space-y-3">
                {result.sectionScores.map((sec, i) => (
                  <div key={i}>
                    <div className="flex items-center
                                    justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span>
                          {sectionStatusIcon(sec.status)}
                        </span>
                        <span className="text-sm font-medium
                                         text-gray-800">
                          {sec.section}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500">
                          {sec.feedback}
                        </span>
                        <span className={`text-sm font-bold
                          ${scoreColor(sec.score).text}`}>
                          {sec.score}/100
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-gray-100
                                    rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full
                          transition-all duration-700
                          ${scoreColor(sec.score).bg}`}
                        style={{ width: `${sec.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Two Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* Keywords Found */}
            {result.foundKeywords?.length > 0 && (
              <div className="bg-white rounded-xl border
                              border-gray-200 p-5">
                <h3 className="text-sm font-semibold
                               text-gray-900 mb-3">
                  ✅ Keywords Found ({result.foundKeywords.length})
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {result.foundKeywords.map((kw, i) => (
                    <span key={i}
                          className="px-2.5 py-0.5 bg-green-50
                                     text-green-700 rounded-full
                                     text-xs border
                                     border-green-200">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Missing Keywords */}
            {result.missingKeywords?.length > 0 && (
              <div className="bg-white rounded-xl border
                              border-gray-200 p-5">
                <h3 className="text-sm font-semibold
                               text-gray-900 mb-3">
                  ❌ Missing Keywords
                  ({result.missingKeywords.length})
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {result.missingKeywords.map((kw, i) => (
                    <span key={i}
                          className="px-2.5 py-0.5 bg-red-50
                                     text-red-700 rounded-full
                                     text-xs border
                                     border-red-200">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Formatting Issues */}
            {result.formattingIssues?.length > 0 && (
              <div className="bg-white rounded-xl border
                              border-gray-200 p-5">
                <h3 className="text-sm font-semibold
                               text-gray-900 mb-3">
                  ⚠️ Formatting Issues
                </h3>
                <ul className="space-y-1.5">
                  {result.formattingIssues.map((issue, i) => (
                    <li key={i}
                        className="flex items-start gap-2
                                   text-sm text-gray-700">
                      <span className="text-amber-500
                                       mt-0.5 shrink-0">•</span>
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Formatting Strengths */}
            {result.formattingStrengths?.length > 0 && (
              <div className="bg-white rounded-xl border
                              border-gray-200 p-5">
                <h3 className="text-sm font-semibold
                               text-gray-900 mb-3">
                  💪 Formatting Strengths
                </h3>
                <ul className="space-y-1.5">
                  {result.formattingStrengths.map((s, i) => (
                    <li key={i}
                        className="flex items-start gap-2
                                   text-sm text-gray-700">
                      <span className="text-green-500
                                       mt-0.5 shrink-0">•</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Quick Wins */}
          {result.quickWins?.length > 0 && (
            <div className="bg-indigo-50 border border-indigo-200
                            rounded-xl p-5">
              <h3 className="text-sm font-semibold text-indigo-900
                             mb-3">
                ⚡ Quick Wins — Easy fixes with big impact
              </h3>
              <div className="space-y-2">
                {result.quickWins.map((win, i) => (
                  <div key={i}
                       className="flex items-start gap-3
                                  bg-white rounded-lg p-3
                                  border border-indigo-100">
                    <span className="w-5 h-5 rounded-full
                      bg-indigo-600 text-white text-xs
                      flex items-center justify-center
                      font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-sm text-gray-700">{win}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Improvement Suggestions */}
          {result.improvementSuggestions?.length > 0 && (
            <div className="bg-white rounded-xl border
                            border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900
                             mb-3">
                💡 Improvement Suggestions
              </h3>
              <ul className="space-y-2">
                {result.improvementSuggestions.map((s, i) => (
                  <li key={i}
                      className="flex items-start gap-2
                                 text-sm text-gray-700">
                    <span className="text-indigo-500
                                     mt-0.5 shrink-0">•</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggested Keywords */}
          {result.suggestedKeywords?.length > 0 && (
            <div className="bg-white rounded-xl border
                            border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900
                             mb-3">
                🔑 Suggested Keywords to Add
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {result.suggestedKeywords.map((kw, i) => (
                  <span key={i}
                        className="px-2.5 py-0.5 bg-purple-50
                                   text-purple-700 rounded-full
                                   text-xs border
                                   border-purple-200">
                    + {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Rescan Button */}
          <button
            onClick={() => setResult(null)}
            className="w-full py-2.5 border border-gray-300
                       text-gray-600 text-sm rounded-lg
                       hover:bg-gray-50 transition-colors">
            ← Scan Another Resume
          </button>
        </div>
      )}
    </div>
  );
}

