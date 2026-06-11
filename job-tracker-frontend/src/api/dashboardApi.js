import API from './axios';

export const dashboardApi = {
  getDashboard: () => API.get('/dashboard'),
};
