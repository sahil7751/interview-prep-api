import API from './axios';

export const interviewEvalApi = {
    startSession: (data) =>
        API.post('/interview-eval/start', data),
    evaluateAnswer: (data) =>
        API.post('/interview-eval/evaluate', data),
    getSessions: (params) =>
        API.get('/interview-eval/sessions', { params }),
    getSession: (id) =>
        API.get(`/interview-eval/sessions/${id}`),
    getIdealAnswer: (questionId) =>
        API.get(`/interview-eval/ideal/${questionId}`),
};

