import API from './axios';

export const resumeApi = {
  upload: (formData) =>
    API.post('/resumes/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getAll: () => API.get('/resumes'),
  download: (id) => API.get(`/resumes/${id}/download`, { responseType: 'blob' }),
  setActive: (id) => API.patch(`/resumes/${id}/activate`),
  updateLabel: (id, label) => API.patch(`/resumes/${id}/label`, { label }),
  delete: (id) => API.delete(`/resumes/${id}`),
};
