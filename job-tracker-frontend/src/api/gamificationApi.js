import API from './axios';

export const gamificationApi = {
    checkIn: () => API.post('/gamification/checkin'),
    getStats: () => API.get('/gamification/stats'),
    getHistory: () => API.get('/gamification/history')
};

