import API from './axios';

export const applicationApi = {
  getAll: (params) => API.get('/applications', { params }),
  getById: (id) => API.get(`/applications/${id}`),
  create: (data) => API.post('/applications', data),
  update: (id, data) => API.put(`/applications/${id}`, data),
  delete: (id) => API.delete(`/applications/${id}`),
};
