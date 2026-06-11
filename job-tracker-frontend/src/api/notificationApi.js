import API from './axios';

export const notificationApi = {
  getAll: () => API.get('/notifications'),
  getUnread: () => API.get('/notifications/unread'),
  getCount: () => API.get('/notifications/count'),
  markAsRead: (id) => API.patch(`/notifications/${id}/read`),
  markAllRead: () => API.patch('/notifications/read-all'),
  clearRead: () => API.delete('/notifications/clear-read'),
};
