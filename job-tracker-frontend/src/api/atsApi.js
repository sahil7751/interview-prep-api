import API from './axios';

export const atsApi = {
    scanPdf: (formData) =>
        API.post('/ats/scan', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),

    scanText: (data) =>
        API.post('/ats/scan-text', data),
};

