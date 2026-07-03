import API from './axios';

export const aiHubApi = {
    getContext: () => API.get('/ai-hub/context'),
    getReadiness: () => API.get('/ai-hub/readiness'),
    getActiveResumeText: () => API.get('/ai-hub/active-resume-text'),
    companyPrep: (data) => API.post('/ai-hub/company-prep', data),

    // Existing endpoints via existing APIs
    analyzeResume: (data) => API.post('/ai/analyze-resume', data),
    generateQuestions: (data) => API.post('/ai/generate-questions', data),
    skillGap: (data) => API.post('/ai/skill-gap', data),
    placementPrep: (data) => API.post('/ai/placement-prep', data),
    atsScamText: (data) => API.post('/ats/scan-text', data),
    chat: (data) => API.post('/career-coach/chat', data),
};
