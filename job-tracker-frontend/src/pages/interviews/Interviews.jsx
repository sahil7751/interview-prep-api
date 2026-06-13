import { useEffect, useState, useCallback } from 'react';
import { interviewApi } from '../../api/interviewApi';
import Modal from '../../components/common/Modal';
import InterviewForm from '../../components/forms/InterviewForm';
import toast from 'react-hot-toast';

const RESULT_STYLES = {
  CLEARED:          'bg-green-100  text-green-700',
  REJECTED:         'bg-red-100    text-red-700',
  ON_HOLD:          'bg-amber-100  text-amber-700',
  AWAITING_RESULT:  'bg-blue-100   text-blue-700',
};

export default function Interviews() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [keyword, setKeyword]       = useState('');
  const [showModal, setShowModal]   = useState(false);
  const [editing, setEditing]       = useState(null);
  const [expanded, setExpanded]     = useState(null);
  const [deleteId, setDeleteId]     = useState(null);

  const fetchInterviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: 0, size: 50 };
      if (keyword) params.keyword = keyword;
      const res = await interviewApi.getAll(params);
      setInterviews(res.data.data.content);
    } catch {
      toast.error('Failed to load interviews');
    } finally {
      setLoading(false);
    }
  }, [keyword]);

  useEffect(() => { fetchInterviews(); }, [fetchInterviews]);

  const handleAdd = async (data) => {
    setSaving(true);
    try {
      await interviewApi.create(data);
      toast.success('Interview logged!');
      setShowModal(false);
      fetchInterviews();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (data) => {
    setSaving(true);
    try {
      await interviewApi.update(editing.id, data);
      toast.success('Interview updated!');
      setEditing(null);
      fetchInterviews();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await interviewApi.delete(deleteId);
      toast.success('Interview deleted');
      setDeleteId(null);
      fetchInterviews();
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Interview Tracker
          </h2>
          <p className="text-gray-500 text-sm mt-0.5">
            Log and review your interview experiences
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700
                     text-white text-sm font-medium rounded-lg
                     transition-colors">
          + Log Interview
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search by company..."
        value={keyword}
        onChange={e => setKeyword(e.target.value)}
        className="w-full max-w-sm px-4 py-2 rounded-lg border
                   border-gray-300 text-sm focus:outline-none
                   focus:ring-2 focus:ring-indigo-500"
      />

      {/* Cards */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-indigo-500
                          border-t-transparent rounded-full
                          animate-spin"/>
        </div>
      ) : interviews.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">🎤</div>
          <p className="font-medium">No interviews logged yet</p>
          <p className="text-sm mt-1">
            Click "Log Interview" to add your first one
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {interviews.map(iv => (
            <div
              key={iv.id}
              className="bg-white rounded-xl border border-gray-200
                         overflow-hidden">

              {/* Card Header */}
              <div
                className="flex items-center justify-between
                           p-4 cursor-pointer hover:bg-gray-50
                           transition-colors"
                onClick={() =>
                  setExpanded(expanded === iv.id ? null : iv.id)
                }>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50
                                  flex items-center justify-center
                                  text-indigo-600 font-bold text-sm
                                  shrink-0">
                    {iv.companyName?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {iv.companyName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {iv.interviewType?.replace(/_/g, ' ')}
                      {iv.interviewDate && ' · ' +
                        new Date(iv.interviewDate)
                          .toLocaleDateString('en-IN', {
                            day: '2-digit', month: 'short',
                            year: 'numeric'
                          })
                      }
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-0.5 rounded-full
                    text-xs font-medium
                    ${RESULT_STYLES[iv.result]
                        || 'bg-gray-100 text-gray-600'}`}>
                    {iv.result?.replace(/_/g, ' ')}
                  </span>
                  <span className="text-gray-400 text-sm">
                    {expanded === iv.id ? '▲' : '▼'}
                  </span>
                </div>
              </div>

              {/* Expanded Detail */}
              {expanded === iv.id && (
                <div className="px-4 pb-4 border-t border-gray-100
                                space-y-3 pt-4">

                  {iv.applicationRole && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Role: </span>
                      {iv.applicationRole}
                    </p>
                  )}

                  {iv.questionsAsked && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500
                                    uppercase tracking-wider mb-1">
                        Questions Asked
                      </p>
                      <pre className="text-sm text-gray-700
                                      whitespace-pre-wrap bg-gray-50
                                      rounded-lg p-3 font-sans">
                        {iv.questionsAsked}
                      </pre>
                    </div>
                  )}

                  {iv.personalNotes && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500
                                    uppercase tracking-wider mb-1">
                        Personal Notes
                      </p>
                      <p className="text-sm text-gray-700 bg-amber-50
                                    rounded-lg p-3">
                        {iv.personalNotes}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => setEditing(iv)}
                      className="px-3 py-1.5 text-xs rounded-lg
                                 border border-gray-300 text-gray-600
                                 hover:bg-gray-100 transition-colors">
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteId(iv.id)}
                      className="px-3 py-1.5 text-xs rounded-lg
                                 border border-red-200 text-red-600
                                 hover:bg-red-50 transition-colors">
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)}
             title="Log Interview Experience" size="lg">
        <InterviewForm
          onSubmit={handleAdd}
          onCancel={() => setShowModal(false)}
          loading={saving}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)}
             title="Edit Interview" size="lg">
        <InterviewForm
          initial={editing}
          onSubmit={handleEdit}
          onCancel={() => setEditing(null)}
          loading={saving}
        />
      </Modal>

      {/* Delete Modal */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)}
             title="Delete Interview" size="sm">
        <p className="text-gray-600 text-sm mb-6">
          Delete this interview record? This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteId(null)}
                  className="flex-1 py-2.5 rounded-lg border
                             border-gray-300 text-sm text-gray-700
                             hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleDelete}
                  className="flex-1 py-2.5 rounded-lg bg-red-600
                             hover:bg-red-700 text-white text-sm
                             font-medium transition-colors">
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
}

