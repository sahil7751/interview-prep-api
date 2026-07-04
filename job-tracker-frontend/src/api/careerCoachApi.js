import API from './axios';

export const careerCoachApi = {
    chat: (data) => API.post('/career-coach/chat', data),
    dailyInsight: () => API.get('/career-coach/daily-insight'),
    weeklyReview: () => API.get('/career-coach/weekly-review'),
};
