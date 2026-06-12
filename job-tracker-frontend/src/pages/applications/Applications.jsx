import { useEffect, useState, useCallback } from 'react';
import { applicationApi } from '../../api/applicationApi';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import ApplicationForm from '../../components/forms/ApplicationForm';
import toast from 'react-hot-toast';

const STATUSES = [
  'ALL','APPLIED','ASSESSMENT_SCHEDULED','ASSESSMENT_CLEARED',
  'GD_ROUND','TECHNICAL_ROUND','HR_ROUND',
  'SELECTED','REJECTED','OFFER_RECEIVED',
];

export default function Applications() {
  const [apps, setApps]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [page, setPage]           = useState(0);
  const [totalPages, setTotal]    = useState(0);
  const [keyword, setKeyword]     = useState('');
  const [status, setStatus]       = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState(null);
  const [deleteId, setDeleteId]   = useState(null);

  const fetchApps = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page, size: 10,
        sortBy: 'applicationDate', sortDir: 'desc',
      };
      if (keyword)           params.keyword = keyword;
      if (status !== 'ALL')  params.status  = status;

      const res = await applicationApi.getAll(params);
      const d   = res.data.data;
      setApps(d.content);
      setTotal(d.totalPages);
    } catch {
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  }, [page, keyword, status]);

  useEffect(() => { fetchApps(); }, [fetchApps]);

  // Reset to page 0 when filter changes
  useEffect(() => { setPage(0); }, [keyword, status]);

  const handleAdd = async (data) => {
    setSaving(true);
    try {
      await applicationApi.create(data);
      toast.success('Application added!');
      setShowModal(false);
      fetchApps();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (data) => {
    setSaving(true);
    try {
      await applicationApi.update(editing.id, data);
      toast.success('Application updated!');
      setEditing(null);
      fetchApps();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await applicationApi.delete(deleteId);
      toast.success('Application deleted');
      setDeleteId(null);
      fetchApps();
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
            Applications
          </h2>
          <p className="text-gray-500 text-sm mt-0.5">
            Track all your job applications
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700
                     text-white text-sm font-medium rounded-lg
                     transition-colors flex items-center gap-2">
          + Add Application
        </button>
      </div>

      {/* Search + Filter Bar */}
      <div className="flex gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Search company or role..."
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          className="flex-1 min-w-48 px-4 py-2 rounded-lg border
                     border-gray-300 text-sm focus:outline-none
                     focus:ring-2 focus:ring-indigo-500"
        />
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-300
                     text-sm focus:outline-none focus:ring-2
                     focus:ring-indigo-500">
          {STATUSES.map(s => (
            <option key={s} value={s}>
              {s === 'ALL' ? 'All Statuses' : s.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200
                      overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {['Company','Role','Package','Location',
                  'Date','Status','Actions'].map(h => (
                  <th key={h}
                      className="text-left px-4 py-3 text-xs
                                 font-semibold text-gray-500
                                 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7}
                      className="text-center py-16 text-gray-400">
                    <div className="flex justify-center">
                      <div className="w-6 h-6 border-2 border-indigo-500
                                      border-t-transparent rounded-full
                                      animate-spin"/>
                    </div>
                  </td>
                </tr>
              ) : apps.length === 0 ? (
                <tr>
                  <td colSpan={7}
                      className="text-center py-16 text-gray-400">
                    <div className="text-4xl mb-2">📭</div>
                    <p>No applications found</p>
                    <p className="text-xs mt-1">
                      Add your first application above
                    </p>
                  </td>
                </tr>
              ) : (
                apps.map((app, i) => (
                  <tr
                    key={app.id}
                    className={`border-b border-gray-100
                      hover:bg-gray-50 transition-colors
                      ${i % 2 === 0 ? '' : 'bg-gray-50/30'}`}>

                    {/* Company */}
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {app.companyName}
                    </td>

                    {/* Role */}
                    <td className="px-4 py-3 text-gray-600">
                      {app.jobRole}
                    </td>

                    {/* Package */}
                    <td className="px-4 py-3 text-gray-600">
                      {app.packageCtc
                        ? `₹${app.packageCtc} LPA`
                        : '—'}
                    </td>

                    {/* Location */}
                    <td className="px-4 py-3 text-gray-600">
                      {app.location || '—'}
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {app.applicationDate
                        ? new Date(app.applicationDate)
                            .toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })
                        : '—'}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <StatusBadge status={app.status} />
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditing(app)}
                          className="text-xs px-2.5 py-1 rounded-md
                                     border border-gray-300
                                     text-gray-600 hover:bg-gray-100
                                     transition-colors">
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteId(app.id)}
                          className="text-xs px-2.5 py-1 rounded-md
                                     border border-red-200
                                     text-red-600 hover:bg-red-50
                                     transition-colors">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between
                          px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Page {page + 1} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => p - 1)}
                disabled={page === 0}
                className="px-3 py-1.5 rounded-lg border border-gray-300
                           text-sm text-gray-600 hover:bg-gray-50
                           disabled:opacity-40 disabled:cursor-not-allowed
                           transition-colors">
                ← Prev
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 rounded-lg border border-gray-300
                           text-sm text-gray-600 hover:bg-gray-50
                           disabled:opacity-40 disabled:cursor-not-allowed
                           transition-colors">
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Add Application"
        size="lg">
        <ApplicationForm
          onSubmit={handleAdd}
          onCancel={() => setShowModal(false)}
          loading={saving}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Edit Application"
        size="lg">
        <ApplicationForm
          initial={editing}
          onSubmit={handleEdit}
          onCancel={() => setEditing(null)}
          loading={saving}
        />
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete Application"
        size="sm">
        <p className="text-gray-600 text-sm mb-6">
          Are you sure you want to delete this application?
          This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setDeleteId(null)}
            className="flex-1 py-2.5 rounded-lg border border-gray-300
                       text-sm text-gray-700 hover:bg-gray-50
                       transition-colors">
            Cancel
          </button>
          <button
            onClick={handleDelete}
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