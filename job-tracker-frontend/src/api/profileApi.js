import API from './axios';

export const profileApi = {
    getProfile: () => API.get('/profile'),
    updateProfile: (data) => API.put('/profile', data),
    uploadPicture: (form) => API.post('/profile/picture', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    getPictureUrl: () => '/profile/picture',
    changePassword: (data) => API.put('/profile/password', data),
    getCompletion: () => API.get('/profile/completion'),
};
