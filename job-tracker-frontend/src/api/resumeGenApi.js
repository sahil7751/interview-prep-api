import API from './axios';

export const resumeGenApi = {
  generate: (data) =>
        API.post('/resume-gen/generate', data),

  downloadPdf: (data) =>
        API.post('/resume-gen/download-pdf', data, {
          responseType: 'blob'
        }),
};


