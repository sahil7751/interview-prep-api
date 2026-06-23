import { useEffect, useState } from 'react';
import { resumeApi } from '../../api/resumeApi';
import ResumeGenerator from './ResumeGenerator';
import toast from 'react-hot-toast';
import AtsScanner from './AtsScanner';

export default function ResumePage() {
  const [activeTab, setActiveTab]   = useState('manager');
  const [resumes, setResumes]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [uploading, setUploading]   = useState(false);
  const [label, setLabel]           = useState('');
  const [dragOver, setDragOver]     = useState(false);

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

  useEffect(() => { fetchResumes(); }, []);

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
      await resumeApi.upload(formData);
      toast.success('Resume uploaded!');
      setLabel('');
      fetchResumes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
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
      fetchResumes();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleDownload = async (id, name) => {
    try {
      const res = await resumeApi.download(id);
      const url = URL.createObjectURL(
        new Blob([res.data], { type: 'application/pdf' })
      );
      const a   = document.createElement('a');
      a.href    = url;
      a.download = name || 'resume.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Download failed');
    }
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Resume
        </h2>
        <p className="text-gray-500 text-sm mt-0.5">
          Upload resumes or generate one with AI
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('manager')}
          className={`px-4 py-2 rounded-lg text-sm font-medium
            transition-colors
            ${activeTab === 'manager'
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-gray-300 text-gray-600'
                  + ' hover:bg-gray-50'}`}>
          📁 Resume Manager
        </button>
        <button
          onClick={() => setActiveTab('generator')}
          className={`px-4 py-2 rounded-lg text-sm font-medium
            transition-colors
            ${activeTab === 'generator'
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-gray-300 text-gray-600'
                  + ' hover:bg-gray-50'}`}>
          ✨ AI Resume Generator
        </button>
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

            <input
              type="text"
              placeholder='Label (e.g. "Software Engineer Resume v3")'
              value={label}
              onChange={e => setLabel(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border
                         border-gray-300 text-sm focus:outline-none
                         focus:ring-2 focus:ring-indigo-500 mb-3"
            />

            <div
              onDragOver={e => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8
                text-center transition-colors cursor-pointer
                ${dragOver
                    ? 'border-indigo-400 bg-indigo-50'
                    : 'border-gray-300 hover:border-indigo-300'}`}
              onClick={() =>
                document.getElementById('resume-upload').click()
              }>
              <div className="text-4xl mb-3">📄</div>
              <p className="text-sm font-medium text-gray-700">
                {uploading
                  ? 'Uploading...'
                  : 'Drop your PDF here or click to browse'}
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

          {/* Resume List */}
          <div className="bg-white rounded-xl border
                          border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">
                Your Resumes ({resumes.length})
              </h3>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-7 h-7 border-4 border-indigo-500
                                border-t-transparent rounded-full
                                animate-spin"/>
              </div>
            ) : resumes.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <div className="text-4xl mb-2">📂</div>
                <p>No resumes uploaded yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {resumes.map(r => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between
                               px-5 py-4 hover:bg-gray-50
                               transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg
                                      bg-red-50 flex items-center
                                      justify-center text-red-600
                                      font-bold text-xs shrink-0">
                        v{r.versionNumber}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium
                                        text-gray-900">
                            {r.label}
                          </p>
                          {r.isActive && (
                            <span className="px-2 py-0.5
                              rounded-full text-xs font-medium
                              bg-green-100 text-green-700">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {r.originalName} · {r.fileSizeReadable}
                          {r.uploadedAt && ' · ' +
                            new Date(r.uploadedAt)
                              .toLocaleDateString('en-IN', {
                                day:   '2-digit',
                                month: 'short',
                                year:  'numeric',
                              })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2
                                    shrink-0">
                      <button
                        onClick={() =>
                          handleDownload(r.id, r.originalName)
                        }
                        className="px-3 py-1.5 text-xs rounded-lg
                                   border border-gray-300
                                   text-gray-600 hover:bg-gray-100
                                   transition-colors">
                        ↓ Download
                      </button>
                      {!r.isActive && (
                        <button
                          onClick={() => handleSetActive(r.id)}
                          className="px-3 py-1.5 text-xs rounded-lg
                                     border border-indigo-200
                                     text-indigo-600
                                     hover:bg-indigo-50
                                     transition-colors">
                          Set Active
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="px-3 py-1.5 text-xs rounded-lg
                                   border border-red-200
                                   text-red-600 hover:bg-red-50
                                   transition-colors">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── AI Generator Tab ─────────────────────────────────── */}
      {activeTab === 'generator' && <ResumeGenerator />}

      {activeTab === 'ats' && <AtsScanner />}

      <button
        onClick={() => setActiveTab('ats')}
        className={`px-4 py-2 rounded-lg text-sm font-medium
          transition-colors
          ${activeTab === 'ats'
              ? 'bg-indigo-600 text-white'
              : 'bg-white border border-gray-300 text-gray-600'
                + ' hover:bg-gray-50'}`}>
        🎯 ATS Scanner
      </button>

    </div>
  );
}