import API from './axios';

export const resumeApi = {
  // Existing
  upload: (formData) => API.post('/resumes/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getAll: () => API.get('/resumes'),
  getById: (id) => API.get(`/resumes/${id}`),
  download: (id) => API.get(`/resumes/${id}/download`,
    { responseType: 'blob' }),
  setActive: (id) => API.patch(`/resumes/${id}/activate`),
  updateLabel: (id, label) => API.patch(`/resumes/${id}/label`,
    { label }),
  delete: (id) => API.delete(`/resumes/${id}`),
  getPictureUrl: () => '/profile/picture',

  // New
  updateMetadata: (id, data) =>
    API.put(`/resumes/${id}/metadata`, data),
  scanAts: (id, jd) =>
    API.post(`/resumes/${id}/scan-ats`,
      null, { params: { jobDescription: jd } }),
  compare: (id1, id2) =>
    API.get('/resumes/compare', { params: { id1, id2 } }),
  getRoleTags: () => API.get('/resumes/role-tags'),
  getByRole: (role) =>
    API.get(`/resumes/by-role/${encodeURIComponent(role)}`),
};