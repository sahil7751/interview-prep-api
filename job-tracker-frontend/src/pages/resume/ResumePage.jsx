import { useEffect, useState, useRef } from 'react';
import { resumeApi } from '../../api/resumeApi';
import ResumeGenerator from './ResumeGenerator';
import AtsScanner from './AtsScanner';
import JobMatch from './JobMatch';
import toast from 'react-hot-toast';

const ROLE_TAGS = [
  'Backend Developer', 'Frontend Developer',
  'Full Stack Developer', 'Data Scientist',
  'DevOps Engineer', 'Android Developer',
  'Cloud Engineer', 'Machine Learning Engineer',
  'Software Engineer', 'Other',
];

const ATS_COLORS = {
  green: 'bg-green-100 text-green-700 border-green-200',
  blue:  'bg-blue-100  text-blue-700  border-blue-200',
  amber: 'bg-amber-100 text-amber-700 border-amber-200',
  red:   'bg-red-100   text-red-700   border-red-200',
};

export default function ResumePage() {
  const [activeTab, setActiveTab]     = useState('manager');
  const [resumes, setResumes]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [uploading, setUploading]     = useState(false);
  const [label, setLabel]             = useState('');
  const [roleTag, setRoleTag]         = useState('');
  const [dragOver, setDragOver]       = useState(false);
  const [editingId, setEditingId]     = useState(null);
  const [editForm, setEditForm]       = useState({});
  const [scanningId, setScanningId]   = useState(null);
  const [compareMode, setCompareMode] = useState(false);
  const [selected, setSelected]       = useState([]);
  const [comparison, setComparison]   = useState(null);
  const [filterRole, setFilterRole]   = useState('ALL');
  const [roleTags, setRoleTags]       = useState([]);

  useEffect(() => {
    fetchResumes();
    fetchRoleTags();
  }, []);

  const fetchResumes = async () => {
    try {
      const res = await resumeApi.getAll();
      setResumes(res.data.data);
    } catch {
      toast.error('Failed to load resumes');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoleTags = async () => {
    try {
      const res = await resumeApi.getRoleTags();
      setRoleTags(res.data.data || []);
    } catch {}
  };

  const handleUpload = async (file) => {
    if (!file) return;
    if (!file.name.endsWith('.pdf')) {
      toast.error('Only PDF files allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File must be under 5 MB');
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    if (label.trim()) formData.append('label', label.trim());

    setUploading(true);
    try {
      const res = await resumeApi.upload(formData);
      const newResume = res.data.data;

      // Auto-save role tag if selected
      if (roleTag) {
        await resumeApi.updateMetadata(newResume.id, { roleTag });
      }

      toast.success('Resume uploaded!');
      setLabel('');
      setRoleTag('');
      fetchResumes();
      fetchRoleTags();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSetActive = async (id) => {
    try {
      await resumeApi.setActive(id);
      toast.success('Active resume updated');
      fetchResumes();
    } catch {
      toast.error('Failed to set active');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this resume?')) return;
    try {
      await resumeApi.delete(id);
      toast.success('Resume deleted');
      setSelected(prev => prev.filter(s => s !== id));
      fetchResumes();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleDownload = async (id, name) => {
    try {
      const res = await resumeApi.download(id);
      const url = URL.createObjectURL(
        new Blob([res.data], { type: 'application/pdf' }));
      const a   = document.createElement('a');
      a.href    = url;
      a.download = name || 'resume.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Download failed');
    }
  };

  const handleSaveEdit = async (id) => {
    try {
      await resumeApi.updateMetadata(id, editForm);
      toast.success('Updated!');
      setEditingId(null);
      fetchResumes();
      fetchRoleTags();
    } catch {
      toast.error('Update failed');
    }
  };

  const handleScanAts = async (id) => {
    setScanningId(id);
    try {
      await resumeApi.scanAts(id);
      toast.success('ATS scan complete!');
      fetchResumes();
    } catch {
      toast.error('ATS scan failed');
    } finally {
      setScanningId(null);
    }
  };

  const handleCompare = async () => {
    if (selected.length !== 2) {
      toast.error('Select exactly 2 resumes to compare');
      return;
    }
    try {
      const res = await resumeApi.compare(
              selected[0], selected[1]);
      setComparison(res.data.data);
    } catch {
      toast.error('Comparison failed');
    }
  };

  const toggleSelect = (id) => {
    setSelected(prev =>
      prev.includes(id)
        ? prev.filter(s => s !== id)
        : prev.length < 2
          ? [...prev, id]
          : prev
    );
  };

  const filteredResumes = filterRole === 'ALL'
    ? resumes
    : resumes.filter(r => r.roleTag === filterRole);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Resume</h2>
        <p className="text-gray-500 text-sm mt-0.5">
          Manage versions, generate with AI, scan ATS score
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'manager',   label: '📁 Resume Manager'     },
          { id: 'generator', label: '✨ AI Resume Generator' },
          { id: 'ats',       label: '🎯 ATS Scanner'        },
          { id: 'jobmatch',  label: '🔍 Job Match'          },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium
              transition-colors
              ${activeTab === tab.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-600'
                    + ' hover:bg-gray-50'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Resume Manager Tab ───────────────────────────────── */}
      {activeTab === 'manager' && (
        <>
          {/* Upload Zone */}
          <div className="bg-white rounded-xl border
                          border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900
                           mb-4">
              Upload New Resume
            </h3>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <input
                type="text"
                placeholder="Label (e.g. Backend Resume v2)"
                value={label}
                onChange={e => setLabel(e.target.value)}
                className="px-3 py-2 rounded-lg border
                           border-gray-300 text-sm
                           focus:outline-none focus:ring-2
                           focus:ring-indigo-500"
              />
              <select
                value={roleTag}
                onChange={e => setRoleTag(e.target.value)}
                className="px-3 py-2 rounded-lg border
                           border-gray-300 text-sm
                           focus:outline-none focus:ring-2
                           focus:ring-indigo-500">
                <option value="">Select Role Tag (optional)</option>
                {ROLE_TAGS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div
              onDragOver={e => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => {
                e.preventDefault();
                setDragOver(false);
                handleUpload(e.dataTransfer.files[0]);
              }}
              className={`border-2 border-dashed rounded-xl p-8
                text-center cursor-pointer transition-colors
                ${dragOver
                    ? 'border-indigo-400 bg-indigo-50'
                    : 'border-gray-300 hover:border-indigo-300'}`}
              onClick={() =>
                document.getElementById('resume-upload').click()
              }>
              <div className="text-4xl mb-2">📄</div>
              <p className="text-sm font-medium text-gray-700">
                {uploading
                  ? 'Uploading...'
                  : 'Drop PDF here or click to browse'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                PDF only · Max 5 MB
              </p>
              {uploading && (
                <div className="flex justify-center mt-3">
                  <div className="w-5 h-5 border-2
                                  border-indigo-500
                                  border-t-transparent
                                  rounded-full animate-spin"/>
                </div>
              )}
            </div>
            <input
              id="resume-upload"
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={e => handleUpload(e.target.files[0])}
            />
          </div>

          {/* Filter + Compare Toolbar */}
          <div className="flex items-center gap-3 flex-wrap">

            {/* Role filter */}
            <select
              value={filterRole}
              onChange={e => setFilterRole(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300
                         text-sm focus:outline-none focus:ring-2
                         focus:ring-indigo-500">
              <option value="ALL">All Roles</option>
              {roleTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>

            <div className="flex-1"/>

            {/* Compare mode toggle */}
            <button
              onClick={() => {
                setCompareMode(!compareMode);
                setSelected([]);
                setComparison(null);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium
                transition-colors
                ${compareMode
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white border border-gray-300'
                      + ' text-gray-600 hover:bg-gray-50'}`}>
              ⚖️ Compare Mode
            </button>

            {compareMode && selected.length === 2 && (
              <button
                onClick={handleCompare}
                className="px-4 py-2 bg-green-600 text-white
                           text-sm rounded-lg hover:bg-green-700
                           transition-colors">
                Compare Selected →
              </button>
            )}
          </div>

          {compareMode && (
            <div className="bg-indigo-50 border border-indigo-200
                            rounded-lg px-4 py-2 text-xs
                            text-indigo-700">
              {selected.length === 0
                ? 'Select 2 resumes to compare'
                : selected.length === 1
                  ? 'Select 1 more resume'
                  : 'Click "Compare Selected" to see comparison'}
            </div>
          )}

          {/* Comparison Result */}
          {comparison && (
            <ComparisonView
              comparison={comparison}
              onClose={() => {
                setComparison(null);
                setCompareMode(false);
                setSelected([]);
              }}
            />
          )}

          {/* Resume List */}
          <div className="bg-white rounded-xl border
                          border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100
                            flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">
                Your Resumes ({filteredResumes.length})
              </h3>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-7 h-7 border-4 border-indigo-500
                                border-t-transparent rounded-full
                                animate-spin"/>
              </div>
            ) : filteredResumes.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <div className="text-4xl mb-2">📂</div>
                <p>No resumes found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredResumes.map(r => (
                  <div key={r.id}>
                    {/* Resume Row */}
                    <div
                      className={`px-5 py-4 transition-colors
                        ${compareMode && selected.includes(r.id)
                            ? 'bg-indigo-50'
                            : 'hover:bg-gray-50'}`}>

                      <div className="flex items-start gap-4">

                        {/* Compare checkbox */}
                        {compareMode && (
                          <input
                            type="checkbox"
                            checked={selected.includes(r.id)}
                            onChange={() => toggleSelect(r.id)}
                            disabled={
                              !selected.includes(r.id)
                              && selected.length >= 2
                            }
                            className="mt-1 accent-indigo-600"
                          />
                        )}

                        {/* Version badge */}
                        <div className="w-10 h-10 rounded-lg
                                        bg-red-50 flex items-center
                                        justify-center text-red-600
                                        font-bold text-xs shrink-0">
                          v{r.versionNumber}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          {editingId === r.id ? (
                            /* Edit Form */
                            <div className="space-y-3">
                              <input
                                value={editForm.label || ''}
                                onChange={e => setEditForm({
                                  ...editForm,
                                  label: e.target.value
                                })}
                                placeholder="Label"
                                className="w-full px-3 py-1.5
                                           rounded-lg border
                                           border-gray-300 text-sm
                                           focus:outline-none
                                           focus:ring-2
                                           focus:ring-indigo-500"
                              />
                              <select
                                value={editForm.roleTag || ''}
                                onChange={e => setEditForm({
                                  ...editForm,
                                  roleTag: e.target.value
                                })}
                                className="w-full px-3 py-1.5
                                           rounded-lg border
                                           border-gray-300 text-sm
                                           focus:outline-none
                                           focus:ring-2
                                           focus:ring-indigo-500">
                                <option value="">No Role Tag</option>
                                {ROLE_TAGS.map(rt => (
                                  <option key={rt} value={rt}>
                                    {rt}
                                  </option>
                                ))}
                              </select>
                              <input
                                value={editForm.targetCompanies
                                        || ''}
                                onChange={e => setEditForm({
                                  ...editForm,
                                  targetCompanies: e.target.value
                                })}
                                placeholder="Target companies (e.g. Google, Amazon)"
                                className="w-full px-3 py-1.5
                                           rounded-lg border
                                           border-gray-300 text-sm
                                           focus:outline-none
                                           focus:ring-2
                                           focus:ring-indigo-500"
                              />
                              <textarea
                                value={editForm.notes || ''}
                                onChange={e => setEditForm({
                                  ...editForm,
                                  notes: e.target.value
                                })}
                                placeholder="Notes about this version..."
                                rows={2}
                                className="w-full px-3 py-1.5
                                           rounded-lg border
                                           border-gray-300 text-sm
                                           focus:outline-none
                                           focus:ring-2
                                           focus:ring-indigo-500
                                           resize-none"
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() =>
                                    handleSaveEdit(r.id)
                                  }
                                  className="px-3 py-1.5 bg-indigo-600
                                             text-white text-xs
                                             rounded-lg
                                             hover:bg-indigo-700">
                                  Save
                                </button>
                                <button
                                  onClick={() =>
                                    setEditingId(null)
                                  }
                                  className="px-3 py-1.5 border
                                             border-gray-300
                                             text-gray-600 text-xs
                                             rounded-lg">
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* Display Mode */
                            <>
                              <div className="flex items-center
                                              gap-2 flex-wrap">
                                <p className="text-sm font-medium
                                              text-gray-900">
                                  {r.label}
                                </p>
                                {r.isActive && (
                                  <span className="px-2 py-0.5
                                    rounded-full text-xs
                                    font-medium bg-green-100
                                    text-green-700">
                                    Active
                                  </span>
                                )}
                                {r.roleTag && (
                                  <span className="px-2 py-0.5
                                    rounded-full text-xs
                                    bg-indigo-100 text-indigo-700
                                    border border-indigo-200">
                                    {r.roleTag}
                                  </span>
                                )}
                                {r.atsScore != null && (
                                  <span className={`px-2 py-0.5
                                    rounded-full text-xs
                                    font-medium border
                                    ${ATS_COLORS[r.atsScoreColor]
                                        || ATS_COLORS.amber}`}>
                                    ATS: {r.atsScore}
                                  </span>
                                )}
                              </div>

                              <p className="text-xs text-gray-400
                                            mt-0.5">
                                {r.originalName}
                                · {r.fileSizeReadable}
                                {r.uploadedAt && ' · ' +
                                  new Date(r.uploadedAt)
                                    .toLocaleDateString('en-IN', {
                                      day:   '2-digit',
                                      month: 'short',
                                      year:  'numeric',
                                    })}
                              </p>

                              {r.targetCompanies && (
                                <p className="text-xs text-gray-500
                                              mt-1">
                                  🏢 {r.targetCompanies}
                                </p>
                              )}

                              {r.notes && (
                                <p className="text-xs text-gray-500
                                              mt-1 italic">
                                  💬 {r.notes}
                                </p>
                              )}
                            </>
                          )}
                        </div>

                        {/* Actions */}
                        {editingId !== r.id && (
                          <div className="flex flex-wrap
                                          items-center gap-1.5
                                          shrink-0">
                            <button
                              onClick={() =>
                                handleDownload(r.id,
                                              r.originalName)
                              }
                              className="px-2.5 py-1.5 text-xs
                                         rounded-lg border
                                         border-gray-300
                                         text-gray-600
                                         hover:bg-gray-100
                                         transition-colors">
                              ↓
                            </button>
                            <button
                              onClick={() => {
                                setEditingId(r.id);
                                setEditForm({
                                  label:           r.label,
                                  roleTag:         r.roleTag || '',
                                  notes:           r.notes   || '',
                                  targetCompanies:
                                    r.targetCompanies || '',
                                });
                              }}
                              className="px-2.5 py-1.5 text-xs
                                         rounded-lg border
                                         border-gray-300
                                         text-gray-600
                                         hover:bg-gray-100
                                         transition-colors">
                              Edit
                            </button>
                            <button
                              onClick={() => handleScanAts(r.id)}
                              disabled={scanningId === r.id}
                              className="px-2.5 py-1.5 text-xs
                                         rounded-lg border
                                         border-purple-200
                                         text-purple-600
                                         hover:bg-purple-50
                                         transition-colors
                                         disabled:opacity-50">
                              {scanningId === r.id
                                ? '...'
                                : '🎯 ATS'}
                            </button>
                            {!r.isActive && (
                              <button
                                onClick={() =>
                                  handleSetActive(r.id)
                                }
                                className="px-2.5 py-1.5 text-xs
                                           rounded-lg border
                                           border-indigo-200
                                           text-indigo-600
                                           hover:bg-indigo-50
                                           transition-colors">
                                Set Active
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(r.id)}
                              className="px-2.5 py-1.5 text-xs
                                         rounded-lg border
                                         border-red-200
                                         text-red-600
                                         hover:bg-red-50
                                         transition-colors">
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'generator' && <ResumeGenerator />}
      {activeTab === 'ats'       && <AtsScanner />}
      {activeTab === 'jobmatch'  && <JobMatch />}
    </div>
  );
}

// ── Comparison View Component ─────────────────────────────────────
function ComparisonView({ comparison, onClose }) {
  const { resume1, resume2, winner, winnerReason,
          resume1Advantages, resume2Advantages,
          recommendation } = comparison;

  const isR1Winner = winner === 'resume1';
  const isR2Winner = winner === 'resume2';

  return (
    <div className="bg-white rounded-xl border border-gray-200
                    overflow-hidden">
      <div className="flex items-center justify-between
                      px-5 py-4 border-b border-gray-100
                      bg-gray-50">
        <h3 className="text-sm font-semibold text-gray-900">
          ⚖️ Resume Comparison
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-lg">
          ×
        </button>
      </div>

      <div className="p-5 space-y-4">

        {/* Recommendation */}
        <div className="bg-indigo-50 border border-indigo-200
                        rounded-xl p-4">
          <p className="text-sm font-semibold text-indigo-900
                        mb-1">
            🎯 Recommendation
          </p>
          <p className="text-sm text-indigo-800">
            {recommendation}
          </p>
        </div>

        {/* Side by side */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { r: resume1, adv: resume1Advantages,
              isWinner: isR1Winner, label: 'Resume 1' },
            { r: resume2, adv: resume2Advantages,
              isWinner: isR2Winner, label: 'Resume 2' },
          ].map(({ r, adv, isWinner, label }) => (
            <div
              key={r.id}
              className={`rounded-xl border p-4
                ${isWinner
                    ? 'border-green-400 bg-green-50'
                    : 'border-gray-200'}`}>
              {isWinner && (
                <div className="flex items-center gap-1
                                mb-2">
                  <span className="text-xs font-bold
                                   text-green-700">
                    🏆 Winner
                  </span>
                </div>
              )}
              <p className="text-sm font-semibold text-gray-900">
                {r.label}
              </p>
              {r.roleTag && (
                <p className="text-xs text-indigo-600 mt-0.5">
                  {r.roleTag}
                </p>
              )}
              {r.atsScore != null ? (
                <p className={`text-2xl font-bold mt-2
                  ${r.atsScoreColor === 'green'
                      ? 'text-green-600'
                      : r.atsScoreColor === 'blue'
                        ? 'text-blue-600'
                        : r.atsScoreColor === 'amber'
                          ? 'text-amber-600'
                          : 'text-red-600'}`}>
                  {r.atsScore}
                  <span className="text-sm font-normal
                                   text-gray-500 ml-1">
                    ATS Score
                  </span>
                </p>
              ) : (
                <p className="text-xs text-gray-400 mt-2">
                  No ATS score yet — click 🎯 ATS to scan
                </p>
              )}

              {adv?.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-semibold
                                text-gray-600 mb-1">
                    Advantages:
                  </p>
                  <ul className="space-y-1">
                    {adv.map((a, i) => (
                      <li key={i}
                          className="text-xs text-gray-700
                                     flex items-start gap-1">
                        <span className="text-green-500
                                         shrink-0">✓</span>
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>

        {winner !== 'tie' && (
          <p className="text-xs text-gray-500 text-center">
            {winnerReason}
          </p>
        )}
      </div>
    </div>
  );
}