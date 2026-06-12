const STATUS_STYLES = {
  APPLIED:              'bg-blue-100   text-blue-700',
  ASSESSMENT_SCHEDULED: 'bg-purple-100 text-purple-700',
  ASSESSMENT_CLEARED:   'bg-indigo-100 text-indigo-700',
  GD_ROUND:             'bg-cyan-100   text-cyan-700',
  TECHNICAL_ROUND:      'bg-amber-100  text-amber-700',
  HR_ROUND:             'bg-orange-100 text-orange-700',
  SELECTED:             'bg-green-100  text-green-700',
  REJECTED:             'bg-red-100    text-red-700',
  OFFER_RECEIVED:       'bg-emerald-100 text-emerald-700',
};

const STATUS_LABELS = {
  APPLIED:              'Applied',
  ASSESSMENT_SCHEDULED: 'Assessment',
  ASSESSMENT_CLEARED:   'Cleared',
  GD_ROUND:             'GD Round',
  TECHNICAL_ROUND:      'Technical',
  HR_ROUND:             'HR Round',
  SELECTED:             'Selected',
  REJECTED:             'Rejected',
  OFFER_RECEIVED:       'Offer ✓',
};

export default function StatusBadge({ status }) {
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium
      ${STATUS_STYLES[status] || 'bg-gray-100 text-gray-600'}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}
