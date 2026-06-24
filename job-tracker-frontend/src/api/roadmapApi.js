import API from './axios';

export const roadmapApi = {
    generate: (data) => API.post('/roadmap/generate', data),
    getAll: () => API.get('/roadmap'),
    getOne: (id) => API.get(`/roadmap/${id}`),
    toggleMilestone: (id, mid) =>
        API.patch(`/roadmap/${id}/milestone/${mid}`),
    delete: (id) => API.delete(`/roadmap/${id}`),
};

