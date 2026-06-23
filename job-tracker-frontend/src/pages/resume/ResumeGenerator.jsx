import { useState } from 'react';
import { resumeGenApi } from '../../api/resumeGenApi';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function ResumeGenerator() {
  const { user } = useAuth();

  const [form, setForm] = useState({
    jobDescription:  '',
    targetRole:      '',
    experienceLevel: 'Fresher',
    fullName:        user?.name  || '',
    email:           user?.email || '',
    phone:           '',
    location:        '',
    existingSkills:  '',
    existingProjects:'',
    education:       '',
  });

  const [result, setResult]       = useState(null);
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [step, setStep]           = useState(1); // 1=form, 2=preview

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleGenerate = async () => {
    if (!form.jobDescription.trim()) {
      toast.error('Job description is required');
      return;
    }
    setGenerating(true);
    try {
      const res = await resumeGenApi.generate(form);
      setResult(res.data.data);
      setStep(2);
      toast.success('Resume generated! ✨');
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await resumeGenApi.downloadPdf(form);
      const url = URL.createObjectURL(
        new Blob([res.data], { type: 'application/pdf' }));
      const a   = document.createElement('a');
      a.href    = url;
      a.download = `${form.targetRole || 'resume'
                      }-${user?.name || 'resume'}.pdf`
                      .replace(/\s+/g, '-').toLowerCase();
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF downloaded!');
    } catch {
      toast.error('Download failed');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* Step Indicator */}
      <div className="flex items-center gap-3">
        <StepDot num={1} active={step === 1}
                 done={step > 1} label="Job Details"/>
        <div className="flex-1 h-0.5 bg-gray-200"/>
        <StepDot num={2} active={step === 2}
                 done={false} label="Preview & Download"/>
      </div>

      {/* Step 1 — Input Form */}
      {step === 1 && (
        <div className="space-y-5">

          {/* JD Input */}
          <div className="bg-white rounded-xl border
                          border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900
                           mb-4">
              Job Information
            </h3>
            <div className="space-y-4">

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium
                                     text-gray-700 mb-1">
                    Target Role
                  </label>
                  <input
                    name="targetRole"
                    value={form.targetRole}
                    onChange={handleChange}
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
                    name="experienceLevel"
                    value={form.experienceLevel}
                    onChange={handleChange}
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
                  name="jobDescription"
                  value={form.jobDescription}
                  onChange={handleChange}
                  rows={6}
                  placeholder="Paste the full job description here. The AI will analyze it and generate a tailored resume..."
                  className="w-full px-3 py-2 rounded-lg border
                             border-gray-300 text-sm
                             focus:outline-none focus:ring-2
                             focus:ring-indigo-500 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Personal Info */}
          <div className="bg-white rounded-xl border
                          border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900
                           mb-1">
              Personal Information
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              Auto-filled from your profile. Update if needed.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { name:'fullName', label:'Full Name',
                  placeholder:'Sahil Jirapure' },
                { name:'email',    label:'Email',
                  placeholder:'sahil@email.com' },
                { name:'phone',    label:'Phone',
                  placeholder:'+91 98765 43210' },
                { name:'location', label:'Location',
                  placeholder:'Pune, Maharashtra' },
              ].map(f => (
                <div key={f.name}>
                  <label className="block text-sm font-medium
                                     text-gray-700 mb-1">
                    {f.label}
                  </label>
                  <input
                    name={f.name}
                    value={form[f.name]}
                    onChange={handleChange}
                    placeholder={f.placeholder}
                    className="w-full px-3 py-2 rounded-lg border
                               border-gray-300 text-sm
                               focus:outline-none focus:ring-2
                               focus:ring-indigo-500"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Background Info */}
          <div className="bg-white rounded-xl border
                          border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900
                           mb-1">
              Background (optional but recommended)
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              The more you provide, the more personalized
              your resume will be.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium
                                   text-gray-700 mb-1">
                  Your Skills
                </label>
                <input
                  name="existingSkills"
                  value={form.existingSkills}
                  onChange={handleChange}
                  placeholder="Java, Spring Boot, React, MySQL, Docker, Git..."
                  className="w-full px-3 py-2 rounded-lg border
                             border-gray-300 text-sm
                             focus:outline-none focus:ring-2
                             focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium
                                   text-gray-700 mb-1">
                  Your Projects
                </label>
                <textarea
                  name="existingProjects"
                  value={form.existingProjects}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Project 1: Job Tracker App (Spring Boot + React + MySQL)&#10;Project 2: Employee Attrition System (Python + ML)"
                  className="w-full px-3 py-2 rounded-lg border
                             border-gray-300 text-sm
                             focus:outline-none focus:ring-2
                             focus:ring-indigo-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium
                                   text-gray-700 mb-1">
                  Education
                </label>
                <input
                  name="education"
                  value={form.education}
                  onChange={handleChange}
                  placeholder="B.Tech CS — MIT ADT University (2025) | CGPA: 8.5"
                  className="w-full px-3 py-2 rounded-lg border
                             border-gray-300 text-sm
                             focus:outline-none focus:ring-2
                             focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating || !form.jobDescription.trim()}
            className="w-full py-3 bg-indigo-600
                       hover:bg-indigo-700 text-white font-medium
                       rounded-lg transition-colors
                       disabled:opacity-60 flex items-center
                       justify-center gap-2 text-sm">
            {generating ? (
              <>
                <div className="w-5 h-5 border-2 border-white
                                border-t-transparent rounded-full
                                animate-spin"/>
                Generating your resume...
              </>
            ) : (
              '✨ Generate ATS-Optimized Resume'
            )}
          </button>
        </div>
      )}

      {/* Step 2 — Preview */}
      {step === 2 && result && (
        <div className="space-y-4">

          {/* Action Bar */}
          <div className="flex items-center justify-between
                          bg-white rounded-xl border border-gray-200
                          p-4">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                ✅ Resume Generated for{' '}
                {result.targetRole}
              </p>
              <p className="text-xs text-gray-500">
                {result.atsKeywords?.length || 0} ATS keywords
                included
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setStep(1); setResult(null); }}
                className="px-4 py-2 border border-gray-300
                           text-gray-600 text-sm rounded-lg
                           hover:bg-gray-50 transition-colors">
                ← Edit
              </button>
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="px-4 py-2 bg-indigo-600
                           hover:bg-indigo-700 text-white text-sm
                           font-medium rounded-lg transition-colors
                           disabled:opacity-60 flex items-center
                           gap-2">
                {downloading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white
                                    border-t-transparent rounded-full
                                    animate-spin"/>
                    Generating PDF...
                  </>
                ) : (
                  '📥 Download PDF'
                )}
              </button>
            </div>
          </div>

          {/* Resume Preview */}
          <div className="bg-white rounded-xl border
                          border-gray-200 p-8 space-y-5
                          font-sans">

            {/* Header */}
            <div className="text-center border-b
                            border-gray-200 pb-4">
              <h1 className="text-2xl font-bold text-gray-900">
                {form.fullName || user?.name}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {[form.email || user?.email,
                  form.phone,
                  form.location]
                  .filter(Boolean).join(' | ')}
              </p>
            </div>

            {/* Summary */}
            {result.professionalSummary && (
              <ResumeSection title="PROFESSIONAL SUMMARY">
                <p className="text-sm text-gray-700 leading-relaxed">
                  {result.professionalSummary}
                </p>
              </ResumeSection>
            )}

            {/* Technical Skills */}
            {result.technicalSkills?.length > 0 && (
              <ResumeSection title="TECHNICAL SKILLS">
                <div className="flex flex-wrap gap-1.5">
                  {result.technicalSkills.map((s, i) => (
                    <span key={i}
                          className="px-2.5 py-0.5 bg-indigo-50
                                     text-indigo-700 rounded
                                     text-xs border
                                     border-indigo-200">
                      {s}
                    </span>
                  ))}
                </div>
                {result.softSkills?.length > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    <span className="font-medium">Soft Skills: </span>
                    {result.softSkills.join(', ')}
                  </p>
                )}
              </ResumeSection>
            )}

            {/* Experience */}
            {result.experience?.length > 0 && (
              <ResumeSection title="EXPERIENCE">
                {result.experience.map((exp, i) => (
                  <div key={i} className="mb-3">
                    <div className="flex items-center
                                    justify-between">
                      <p className="text-sm font-semibold
                                    text-gray-900">
                        {exp.role} — {exp.company}
                      </p>
                      {exp.duration && (
                        <span className="text-xs text-gray-500">
                          {exp.duration}
                        </span>
                      )}
                    </div>
                    <ul className="mt-1 space-y-0.5">
                      {exp.bulletPoints?.map((bp, j) => (
                        <li key={j}
                            className="text-xs text-gray-700
                                       flex items-start gap-1.5">
                          <span className="text-indigo-500
                                           mt-0.5 shrink-0">
                            •
                          </span>
                          {bp}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </ResumeSection>
            )}

            {/* Projects */}
            {result.projects?.length > 0 && (
              <ResumeSection title="PROJECTS">
                {result.projects.map((proj, i) => (
                  <div key={i} className="mb-3">
                    <p className="text-sm font-semibold
                                  text-gray-900">
                      {proj.name}
                      {proj.techStack && (
                        <span className="font-normal
                                         text-gray-500 ml-2
                                         text-xs">
                          | {proj.techStack}
                        </span>
                      )}
                    </p>
                    <ul className="mt-1 space-y-0.5">
                      {proj.bulletPoints?.map((bp, j) => (
                        <li key={j}
                            className="text-xs text-gray-700
                                       flex items-start gap-1.5">
                          <span className="text-indigo-500
                                           mt-0.5 shrink-0">
                            •
                          </span>
                          {bp}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </ResumeSection>
            )}

            {/* Achievements */}
            {result.achievements?.length > 0 && (
              <ResumeSection title="ACHIEVEMENTS">
                <ul className="space-y-0.5">
                  {result.achievements.map((a, i) => (
                    <li key={i}
                        className="text-xs text-gray-700
                                   flex items-start gap-1.5">
                      <span className="text-indigo-500
                                       mt-0.5 shrink-0">•</span>
                      {a}
                    </li>
                  ))}
                </ul>
              </ResumeSection>
            )}

            {/* Education */}
            {result.educationSection && (
              <ResumeSection title="EDUCATION">
                <p className="text-sm text-gray-700">
                  {result.educationSection}
                </p>
              </ResumeSection>
            )}

            {/* ATS Keywords */}
            {result.atsKeywords?.length > 0 && (
              <ResumeSection title="KEY COMPETENCIES">
                <p className="text-xs text-gray-600">
                  {result.atsKeywords.join('  •  ')}
                </p>
              </ResumeSection>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────

function ResumeSection({ title, children }) {
  return (
    <div>
      <h2 className="text-xs font-bold text-indigo-700
                     uppercase tracking-widest mb-2
                     border-b border-indigo-100 pb-1">
        {title}
      </h2>
      {children}
    </div>
  );
}

function StepDot({ num, active, done, label }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-8 h-8 rounded-full flex items-center
        justify-center text-sm font-bold transition-colors
        ${done  ? 'bg-green-500 text-white'
        : active ? 'bg-indigo-600 text-white'
                 : 'bg-gray-200 text-gray-500'}`}>
        {done ? '✓' : num}
      </div>
      <span className={`text-xs font-medium
        ${active ? 'text-indigo-700' : 'text-gray-400'}`}>
        {label}
      </span>
    </div>
  );
}
