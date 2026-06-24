import API from './axios';

export const jobMatchApi = {
    analyze: (data) =>
        API.post('/job-match/analyze', data),

    analyzePdf: (formData) =>
        API.post('/job-match/analyze-pdf', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
};

