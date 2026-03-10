const API_BASE = '/api';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `API error ${res.status}`);
  }
  return res.json();
}

// ─── Sessions API ─────────────────────────────────────────────────────────────

export const sessionsApi = {
  list: () => request<any[]>('/sessions'),
  getLive: () => request<any[]>('/sessions/live'),
  get: (id: string) => request<any>(`/sessions/${id}`),
  create: (data: { title: string; description?: string; mentor_id: string; scheduled_at?: string }) =>
    request<any>('/sessions', { method: 'POST', body: JSON.stringify(data) }),
  start: (id: string) => request<any>(`/sessions/${id}/start`, { method: 'PATCH' }),
  end: (id: string) => request<any>(`/sessions/${id}/end`, { method: 'PATCH' }),
  join: (id: string, user_id: string) =>
    request<any>(`/sessions/${id}/join`, { method: 'POST', body: JSON.stringify({ user_id }) }),
  leave: (id: string, user_id: string) =>
    request<any>(`/sessions/${id}/leave`, { method: 'POST', body: JSON.stringify({ user_id }) }),
  getChat: (id: string) => request<any[]>(`/sessions/${id}/chat`),
  sendChat: (id: string, data: { sender_id: string; sender_name: string; content: string }) =>
    request<any>(`/sessions/${id}/chat`, { method: 'POST', body: JSON.stringify(data) }),
  getQuestions: (id: string) => request<any[]>(`/sessions/${id}/questions`),
  askQuestion: (id: string, data: { user_id: string; user_name: string; text: string }) =>
    request<any>(`/sessions/${id}/questions`, { method: 'POST', body: JSON.stringify(data) }),
  voteQuestion: (sessionId: string, questionId: string) =>
    request<any>(`/sessions/${sessionId}/questions/${questionId}/vote`, { method: 'POST' }),
};

// ─── Users API ────────────────────────────────────────────────────────────────

export const usersApi = {
  list: () => request<any[]>('/users'),
  get: (id: string) => request<any>(`/users/${id}`),
  getByRole: (role: string) => request<any[]>(`/users/role/${role}`),
  login: (data: { email?: string; role?: string }) =>
    request<any>('/users/login', { method: 'POST', body: JSON.stringify(data) }),
};

// ─── Courses API ──────────────────────────────────────────────────────────────

export const coursesApi = {
  list: () => request<any[]>('/courses'),
  get: (id: string) => request<any>(`/courses/${id}`),
  getUserCourses: (userId: string) => request<any[]>(`/courses/user/${userId}`),
  enroll: (courseId: string, user_id: string) =>
    request<any>(`/courses/${courseId}/enroll`, { method: 'POST', body: JSON.stringify({ user_id }) }),
  updateProgress: (courseId: string, user_id: string, progress: number) =>
    request<any>(`/courses/${courseId}/progress`, { method: 'PATCH', body: JSON.stringify({ user_id, progress }) }),
};

// ─── Edge Hubs API ────────────────────────────────────────────────────────────

export const edgeHubsApi = {
  list: () => request<any[]>('/edge-hubs'),
  get: (id: string) => request<any>(`/edge-hubs/${id}`),
  heartbeat: (id: string, data?: { connected_students?: number; bandwidth_saved_mb?: number }) =>
    request<any>(`/edge-hubs/${id}/heartbeat`, { method: 'POST', body: JSON.stringify(data || {}) }),
  getStats: () => request<any>('/edge-hubs/stats/summary'),
};

// ─── AI API (server-side proxy) ───────────────────────────────────────────────

export const aiApi = {
  chat: (message: string, history?: any[]) =>
    request<{ text: string }>('/ai/chat', { method: 'POST', body: JSON.stringify({ message, history }) }),
  summarize: (text: string) =>
    request<{ summary: string }>('/ai/summarize', { method: 'POST', body: JSON.stringify({ text }) }),
  quiz: (topic: string) =>
    request<any[]>('/ai/quiz', { method: 'POST', body: JSON.stringify({ topic }) }),
  explain: (concept: string) =>
    request<{ explanation: string }>('/ai/explain', { method: 'POST', body: JSON.stringify({ concept }) }),
  learningPath: (goal: string) =>
    request<any[]>('/ai/learning-path', { method: 'POST', body: JSON.stringify({ goal }) }),
};

// ─── Profiles API ─────────────────────────────────────────────────────────────

export const profilesApi = {
  get: (userId: string) => request<any>(`/profiles/${userId}`),
  save: (data: any) =>
    request<any>('/profiles', { method: 'POST', body: JSON.stringify(data) }),
  getRecommendations: (userId: string) =>
    request<any[]>(`/profiles/${userId}/recommendations`),
  generateRecommendations: (userId: string) =>
    request<any[]>(`/profiles/${userId}/recommendations/generate`, { method: 'POST' }),
  getMentors: () => request<any[]>('/profiles/mentors/all'),
};

// ─── Health ───────────────────────────────────────────────────────────────────

export const healthApi = {
  check: () => request<{ status: string; uptime: number; timestamp: string }>('/health'),
};
