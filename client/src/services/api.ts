import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? (window.location.origin.includes('localhost') ? 'http://localhost:5000/api' : '/api') : '/api');

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const getToken = () => sessionStorage.getItem('taskstudio_token') || localStorage.getItem('taskstudio_token');

const clearAuth = () => {
  localStorage.removeItem('taskstudio_token');
  localStorage.removeItem('taskstudio_user');
  sessionStorage.removeItem('taskstudio_token');
  sessionStorage.removeItem('taskstudio_user');
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuth();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

import { 
  Role, Section, TaskPriority, TaskStatus, User, TrackerItem, ContentItem, 
  MeetingNote, Task, Tool, Idea, Message, Kra
} from '../types';

// Auth API
export const authAPI = {
  register: (data: { name: string; email: string; password: string; role?: string }) =>
    api.post('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),

  googleLogin: (idToken: string) =>
    api.post('/auth/google/callback', { idToken }),

  getMe: () =>
    api.get('/auth/me'),

  refreshToken: () =>
    api.post('/auth/refresh'),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post('/auth/change-password', data),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, newPassword: string) =>
    api.post('/auth/reset-password', { token, newPassword }),

  logout: () =>
    api.post('/auth/logout'),
};

// Users API
export const usersAPI = {
  getTeam: () =>
    api.get('/users/team'),

  getAll: () =>
    api.get('/users'),

  getById: (id: string) =>
    api.get(`/users/${id}`),

  updateProfile: (data: { name?: string; mood?: string; capacity?: number; status?: string; avatar?: string }) =>
    api.put('/users/profile', data),

  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  addTeamMember: (data: { name: string; email: string; password: string; role?: string }) =>
    api.post('/users/team', data),

  updateUser: (id: string, data: { name?: string; role?: string; capacity?: number; status?: string; isActive?: boolean }) =>
    api.put(`/users/${id}`, data),

  deleteUser: (id: string) =>
    api.delete(`/users/${id}`),
};

// Tracker API
export const trackerAPI = {
  getAll: () =>
    api.get('/tracker'),

  create: (data: Partial<TrackerItem>) =>
    api.post('/tracker', data),

  update: (id: string, data: Partial<TrackerItem>) =>
    api.put(`/tracker/${id}`, data),

  delete: (id: string) =>
    api.delete(`/tracker/${id}`),

  getHistory: (params?: { startDate?: string; endDate?: string }) =>
    api.get('/tracker/history', { params }),

  archive: () =>
    api.post('/tracker/archive'),

  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/tracker/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
};

// Tasks API
export const tasksAPI = {
  getAll: () =>
    api.get('/tasks'),

  create: (data: { title: string; priority?: string; dueDate?: string; assigneeId?: string }) =>
    api.post('/tasks', data),

  update: (id: string, data: Partial<Task>) =>
    api.put(`/tasks/${id}`, data),

  toggle: (id: string) =>
    api.patch(`/tasks/${id}/toggle`),

  delete: (id: string) =>
    api.delete(`/tasks/${id}`),

  bulkDelete: (ids: string[]) =>
    api.post('/tasks/bulk-delete', { ids }),
};

// Meetings API
export const meetingsAPI = {
  getAll: () =>
    api.get('/meetings'),

  getById: (id: string) =>
    api.get(`/meetings/${id}`),

  create: (data: { title: string; date: string; type?: string; attendees?: string[]; notes?: string; actionItems?: string; link?: string }) =>
    api.post('/meetings', data),

  update: (id: string, data: Partial<MeetingNote>) =>
    api.put(`/meetings/${id}`, data),

  delete: (id: string) =>
    api.delete(`/meetings/${id}`),
};

// Content API (content items, tools, ideas)
export const contentAPI = {
  // Content items
  getContentItems: () =>
    api.get('/content/content'),

  createContentItem: (data: { title: string; platform: string; publishDate: string; type?: string; stage?: string; link?: string; goal?: string; caption?: string; notes?: string }) =>
    api.post('/content/content', data),

  updateContentItem: (id: string, data: Partial<ContentItem>) =>
    api.put(`/content/content/${id}`, data),

  deleteContentItem: (id: string) =>
    api.delete(`/content/content/${id}`),

  // Tools
  getTools: () =>
    api.get('/content/tools'),

  createTool: (data: { name: string; url: string; icon?: string; category: string }) =>
    api.post('/content/tools', data),

  deleteTool: (id: string) =>
    api.delete(`/content/tools/${id}`),

  // Ideas
  getIdeas: () =>
    api.get('/content/ideas'),

  createIdea: (data: { text: string; category?: string }) =>
    api.post('/content/ideas', data),

  deleteIdea: (id: string) =>
    api.delete(`/content/ideas/${id}`),
};

// Calendar API
export const calendarAPI = {
  getAuthUrl: () =>
    api.get('/calendar/auth-url'),

  handleCallback: (code: string) =>
    api.post('/calendar/callback', { code }),

  getEvents: () =>
    api.get('/calendar/events'),
};

// Messages API
export const messagesAPI = {
  getConversations: () =>
    api.get('/messages/conversations'),

  getMessages: (userId: string) =>
    api.get(`/messages/${userId}`),

  send: (receiverId: string, content: string) =>
    api.post('/messages', { receiverId, content }),

  getUnreadCount: () =>
    api.get('/messages/unread/count'),

  getRoomMessages: (roomId: string) =>
    api.get(`/messages/room/${roomId}`),

  sendRoomMessage: (roomId: string, content: string) =>
    api.post('/messages/room', { roomId, content }),
};

// KRAs API
export const krasAPI = {
  getAll: (userId?: string) =>
    api.get('/kras', { params: { userId } }),

  create: (data: Partial<Kra>) =>
    api.post('/kras', data),

  update: (id: string, data: Partial<Kra>) =>
    api.put(`/kras/${id}`, data),

  delete: (id: string) =>
    api.delete(`/kras/${id}`),
};

export default api;