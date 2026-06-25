import API from './axios';

export const careerCoachApi = {
    chat: (data) => API.post('/career-coach/chat', data),
};
