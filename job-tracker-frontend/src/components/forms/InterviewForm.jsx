import { useState, useEffect } from 'react';

const TYPES = [
  'ONLINE_ASSESSMENT','TECHNICAL','HR',
  'MANAGERIAL','GROUP_DISCUSSION',
  'CASE_STUDY','SYSTEM_DESIGN','BEHAVIOURAL','OTHER',
];
const RESULTS = [
  'CLEARED','REJECTED','ON_HOLD','AWAITING_RESULT'
];

const empty = {
  companyName: '', applicationId: '',
  interviewDate: '', interviewType: 'TECHNICAL',
  questionsAsked: '', personalNotes: '',
  result: 'AWAITING_RESULT',
};

export default function InterviewForm({
  initial, onSubmit, onCancel, loading
}) {
  const [form, setForm]     = useState(empty);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setForm(initial
      ? { ...empty, ...initial,
          applicationId:  initial.applicationId  || '',
          interviewDate:  initial.interviewDate
            ? initial.interviewDate.slice(0, 16) : '',
        }
      : empty);
  }, [initial]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const validate = () => {
    const errs = {};
    if (!form.companyName.trim()) errs.companyName = 'Required';
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSubmit({
      ...form,
      applicationId: form.applicationId
        ? Number(form.applicationId) : null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium
                             text-gray-700 mb-1">
            Company Name *
          </label>
          <input
            name="companyName"
            value={form.companyName}
            onChange={handleChange}
            placeholder="Google"
            className={`w-full px-3 py-2 rounded-lg border text-sm
              focus:outline-none focus:ring-2 focus:ring-indigo-500
              ${errors.companyName
                  ? 'border-red-400' : 'border-gray-300'}`}
          />
          {errors.companyName && (
            <p className="text-red-500 text-xs mt-1">
              {errors.companyName}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium
                             text-gray-700 mb-1">
            Application ID (optional)
          </label>
          <input
            name="applicationId"
            value={form.applicationId}
            onChange={handleChange}
            placeholder="Link to application"
            type="number"
            className="w-full px-3 py-2 rounded-lg border
                       border-gray-300 text-sm focus:outline-none
                       focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium
                             text-gray-700 mb-1">
            Interview Date & Time
          </label>
          <input
            type="datetime-local"
            name="interviewDate"
            value={form.interviewDate}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded-lg border
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
            name="interviewType"
            value={form.interviewType}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded-lg border
                       border-gray-300 text-sm focus:outline-none
                       focus:ring-2 focus:ring-indigo-500">
            {TYPES.map(t => (
              <option key={t} value={t}>
                {t.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium
                           text-gray-700 mb-1">
          Questions Asked
        </label>
        <textarea
          name="questionsAsked"
          value={form.questionsAsked}
          onChange={handleChange}
          rows={4}
          placeholder="1. What is a HashMap?&#10;2. Design a URL shortener&#10;3. ..."
          className="w-full px-3 py-2 rounded-lg border border-gray-300
                     text-sm focus:outline-none focus:ring-2
                     focus:ring-indigo-500 resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium
                           text-gray-700 mb-1">
          Personal Notes
        </label>
        <textarea
          name="personalNotes"
          value={form.personalNotes}
          onChange={handleChange}
          rows={2}
          placeholder="How it went, what to improve..."
          className="w-full px-3 py-2 rounded-lg border border-gray-300
                     text-sm focus:outline-none focus:ring-2
                     focus:ring-indigo-500 resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium
                           text-gray-700 mb-1">
          Result
        </label>
        <select
          name="result"
          value={form.result}
          onChange={handleChange}
          className="w-full px-3 py-2 rounded-lg border border-gray-300
                     text-sm focus:outline-none focus:ring-2
                     focus:ring-indigo-500">
          {RESULTS.map(r => (
            <option key={r} value={r}>
              {r.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
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
                     font-medium transition-colors disabled:opacity-60
                     flex items-center justify-center gap-2">
          {loading && (
            <div className="w-4 h-4 border-2 border-white
                            border-t-transparent rounded-full
                            animate-spin"/>
          )}
          {loading ? 'Saving...' : (initial ? 'Update' : 'Log Interview')}
        </button>
      </div>
    </form>
  );
}

