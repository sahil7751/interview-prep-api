import API from './axios';

export const profileApi = {
    getProfile: () => API.get('/profile'),
    updateProfile: (data) => API.put('/profile', data),
    uploadPicture: (form) => API.post('/profile/picture', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    getPictureUrl: (userId, bust) =>
        `http://localhost:8081/api/v1/profile/picture?t=${bust || Date.now()}`,
    changePassword: (data) => API.put('/profile/password', data),
    getCompletion: () => API.get('/profile/completion'),
    reviewProfile: () => API.post('/profile/review'),
};
