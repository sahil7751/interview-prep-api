import { useState, useEffect } from 'react';

const STATUSES = [
  'APPLIED','ASSESSMENT_SCHEDULED','ASSESSMENT_CLEARED',
  'GD_ROUND','TECHNICAL_ROUND','HR_ROUND',
  'SELECTED','REJECTED','OFFER_RECEIVED',
];

const empty = {
  companyName: '', jobRole: '', packageCtc: '',
  location: '', applicationDate: '', status: 'APPLIED',
  jobDescription: '', applicationLink: '', notes: '',
};

export default function ApplicationForm({ initial, onSubmit, onCancel, loading }) {
  const [form, setForm]     = useState(empty);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initial) {
      setForm({
        ...initial,
        packageCtc:      initial.packageCtc      || '',
        applicationDate: initial.applicationDate || '',
      });
    } else {
      setForm(empty);
    }
  }, [initial]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const validate = () => {
    const errs = {};
    if (!form.companyName.trim()) errs.companyName = 'Required';
    if (!form.jobRole.trim())     errs.jobRole     = 'Required';
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSubmit({
      ...form,
      packageCtc: form.packageCtc ? parseFloat(form.packageCtc) : null,
    });
  };

  const field = (name, label, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={form[name]}
        onChange={handleChange}
        placeholder={placeholder}
        className={`w-full px-3 py-2 rounded-lg border text-sm
          focus:outline-none focus:ring-2 focus:ring-indigo-500
          ${errors[name] ? 'border-red-400' : 'border-gray-300'}`}
      />
      {errors[name] && (
        <p className="text-red-500 text-xs mt-1">{errors[name]}</p>
      )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {field('companyName', 'Company Name', 'text', 'Google')}
        {field('jobRole',     'Job Role',     'text', 'Software Engineer')}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {field('packageCtc',      'Package (LPA)', 'number', '12')}
        {field('location',        'Location',      'text',   'Bangalore')}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {field('applicationDate', 'Application Date', 'date')}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded-lg border border-gray-300
                       text-sm focus:outline-none focus:ring-2
                       focus:ring-indigo-500">
            {STATUSES.map(s => (
              <option key={s} value={s}>
                {s.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>
      {field('applicationLink', 'Application Link', 'url', 'https://...')}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Job Description
        </label>
        <textarea
          name="jobDescription"
          value={form.jobDescription}
          onChange={handleChange}
          rows={3}
          placeholder="Paste job description here..."
          className="w-full px-3 py-2 rounded-lg border border-gray-300
                     text-sm focus:outline-none focus:ring-2
                     focus:ring-indigo-500 resize-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <textarea
          name="notes"
          value={form.notes}
          onChange={handleChange}
          rows={2}
          placeholder="Any personal notes..."
          className="w-full px-3 py-2 rounded-lg border border-gray-300
                     text-sm focus:outline-none focus:ring-2
                     focus:ring-indigo-500 resize-none"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-lg border border-gray-300
                     text-sm text-gray-700 hover:bg-gray-50
                     transition-colors">
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-2.5 rounded-lg bg-indigo-600
                     hover:bg-indigo-700 text-white text-sm
                     font-medium transition-colors
                     disabled:opacity-60 flex items-center
                     justify-center gap-2">
          {loading && (
            <div className="w-4 h-4 border-2 border-white
                            border-t-transparent rounded-full
                            animate-spin"/>
          )}
          {loading ? 'Saving...' : (initial ? 'Update' : 'Add Application')}
        </button>
      </div>
    </form>
  );
}