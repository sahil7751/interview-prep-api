import API from '../../../src/api/axios';

export const gamificationApi = {
    getStats: () => API.get('/gamification/stats'),
    checkIn: () => API.post('/gamification/checkin'),
};

