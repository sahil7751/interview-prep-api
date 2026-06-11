import API from './axios';

export const interviewApi = {
  getAll: (params) => API.get('/interviews', { params }),
  getById: (id) => API.get(`/interviews/${id}`),
  create: (data) => API.post('/interviews', data),
  update: (id, data) => API.put(`/interviews/${id}`, data),
  delete: (id) => API.delete(`/interviews/${id}`),
};
