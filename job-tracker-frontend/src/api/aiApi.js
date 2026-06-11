import API from './axios';

export const aiApi = {
  analyzeResume: (data) => API.post('/ai/analyze-resume', data),
  generateQuestions: (data) => API.post('/ai/generate-questions', data),
  skillGap: (data) => API.post('/ai/skill-gap', data),
  placementPrep: (data) => API.post('/ai/placement-prep', data),
};
