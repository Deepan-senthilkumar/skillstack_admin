// API Client for SkillStack Tutor Management Platform — Admin & Staff Portal

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

class AdminApiClient {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  getToken() {
    return localStorage.getItem('skillstack_admin_access') || localStorage.getItem('kalari_admin_access');
  }

  setTokens(access, refresh) {
    if (access) {
      localStorage.setItem('skillstack_admin_access', access);
      localStorage.setItem('kalari_admin_access', access);
    }
    if (refresh) {
      localStorage.setItem('skillstack_admin_refresh', refresh);
      localStorage.setItem('kalari_admin_refresh', refresh);
    }
  }

  clearTokens() {
    localStorage.removeItem('skillstack_admin_access');
    localStorage.removeItem('skillstack_admin_refresh');
    localStorage.removeItem('skillstack_admin_user');
    localStorage.removeItem('kalari_admin_access');
    localStorage.removeItem('kalari_admin_refresh');
    localStorage.removeItem('kalari_admin_user');
  }

  getUser() {
    try {
      const u = localStorage.getItem('skillstack_admin_user') || localStorage.getItem('kalari_admin_user');
      return u ? JSON.parse(u) : null;
    } catch (e) {
      console.warn('Failed to parse cached admin user', e);
      return null;
    }
  }

  setUser(user) {
    if (user) {
      localStorage.setItem('skillstack_admin_user', JSON.stringify(user));
      localStorage.setItem('kalari_admin_user', JSON.stringify(user));
    }
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    const token = this.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const response = await fetch(url, { ...options, headers });

      if (response.status === 401 && !options._retry && (localStorage.getItem('skillstack_admin_refresh') || localStorage.getItem('kalari_admin_refresh'))) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          options._retry = true;
          return this.request(endpoint, options);
        } else {
          this.clearTokens();
          window.dispatchEvent(new CustomEvent('admin:logout'));
        }
      }

      if (response.status === 204) {
        return { success: true };
      }

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const error = new Error(data.detail || data.error || (Array.isArray(data) ? data[0] : JSON.stringify(data)) || 'Request failed');
        error.status = response.status;
        error.data = data;
        throw error;
      }
      return data;
    } catch (err) {
      throw err;
    }
  }

  async refreshToken() {
    const refresh = localStorage.getItem('skillstack_admin_refresh') || localStorage.getItem('kalari_admin_refresh');
    if (!refresh) return false;
    try {
      const res = await fetch(`${this.baseUrl}/auth/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      });
      if (res.ok) {
        const data = await res.json();
        this.setTokens(data.access, refresh);
        return true;
      }
    } catch (e) {
      console.error('Admin token refresh error', e);
    }
    return false;
  }

  // Auth
  async login(username, password) {
    const data = await this.request('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    this.setTokens(data.access, data.refresh);
    const user = data.user || await this.getMe();
    this.setUser(user);
    return user;
  }

  async getMe() {
    return this.request('/auth/me/');
  }

  async updateProfile(profileData) {
    const user = await this.request('/auth/me/', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
    this.setUser(user);
    return user;
  }

  async checkHealth() {
    try { return await this.request('/health/'); }
    catch (e) { return { status: 'offline', error: e.message }; }
  }

  // Courses (Subjects) CRUD
  async getSubjects() { return this.request('/staff/subjects/'); }
  async getSubject(id) { return this.request(`/staff/subjects/${id}/`); }
  async createSubject(data) {
    return this.request('/staff/subjects/', { method: 'POST', body: JSON.stringify(data) });
  }
  async updateSubject(id, data) {
    return this.request(`/staff/subjects/${id}/`, { method: 'PUT', body: JSON.stringify(data) });
  }
  async deleteSubject(id) {
    return this.request(`/staff/subjects/${id}/`, { method: 'DELETE' });
  }

  // Modules, Topics, and Practice Programs CRUD
  async getModules() { return this.request('/staff/modules/'); }
  async createModule(data) { return this.request('/staff/modules/', { method: 'POST', body: JSON.stringify(data) }); }
  async updateModule(id, data) { return this.request(`/staff/modules/${id}/`, { method: 'PUT', body: JSON.stringify(data) }); }
  async deleteModule(id) { return this.request(`/staff/modules/${id}/`, { method: 'DELETE' }); }

  async getTopics() { return this.request('/staff/topics/'); }
  async createTopic(data) { return this.request('/staff/topics/', { method: 'POST', body: JSON.stringify(data) }); }
  async updateTopic(id, data) { return this.request(`/staff/topics/${id}/`, { method: 'PUT', body: JSON.stringify(data) }); }
  async deleteTopic(id) { return this.request(`/staff/topics/${id}/`, { method: 'DELETE' }); }

  async getProblems() { return this.request('/staff/problems/'); }
  async createProblem(data) { return this.request('/staff/problems/', { method: 'POST', body: JSON.stringify(data) }); }
  async updateProblem(id, data) { return this.request(`/staff/problems/${id}/`, { method: 'PUT', body: JSON.stringify(data) }); }
  async deleteProblem(id) { return this.request(`/staff/problems/${id}/`, { method: 'DELETE' }); }

  // Batch Management CRUD (duplicate course names supported)
  async getBatches(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/batches/${query ? '?' + query : ''}`);
  }
  async getBatch(id) { return this.request(`/batches/${id}/`); }
  async createBatch(data) { return this.request('/batches/', { method: 'POST', body: JSON.stringify(data) }); }
  async updateBatch(id, data) { return this.request(`/batches/${id}/`, { method: 'PUT', body: JSON.stringify(data) }); }
  async deleteBatch(id) { return this.request(`/batches/${id}/`, { method: 'DELETE' }); }

  // Topic Progress Tracking (Independent of attendance)
  async getBatchTopicProgress(batchId) {
    return this.request(`/batches/${batchId}/progress/`);
  }
  async toggleBatchTopicProgress(batchId, topicId, isCompleted, remarks = '') {
    return this.request(`/batches/${batchId}/topics/${topicId}/toggle/`, {
      method: 'POST',
      body: JSON.stringify({ is_completed: isCompleted, remarks }),
    });
  }

  // Staff Daily Task / Performance & Attendance Tracking
  async getStaffDailyLogs(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/staff-logs/${query ? '?' + query : ''}`);
  }
  async createStaffDailyLog(data) {
    return this.request('/staff-logs/', { method: 'POST', body: JSON.stringify(data) });
  }
  async updateStaffDailyLog(id, data) {
    return this.request(`/staff-logs/${id}/`, { method: 'PUT', body: JSON.stringify(data) });
  }
  async deleteStaffDailyLog(id) {
    return this.request(`/staff-logs/${id}/`, { method: 'DELETE' });
  }
  async getDailyBatchMatrix(dateStr = '') {
    return this.request(`/staff-logs/matrix/${dateStr ? '?date=' + dateStr : ''}`);
  }

  // Multi-Dimensional Reporting & Analytics
  async getReportingAnalytics(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/reports/analytics/${query ? '?' + query : ''}`);
  }

  // Code Submissions & Auto-Validation Inspector
  async getSubmissions(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/staff/submissions/${query ? '?' + query : ''}`);
  }
  async getSubmission(id) { return this.request(`/staff/submissions/${id}/`); }
  async reviewSubmission(id, status, score, staffFeedback) {
    return this.request(`/staff/submissions/${id}/review/`, {
      method: 'POST',
      body: JSON.stringify({ status, score, staff_feedback: staffFeedback }),
    });
  }
  async deleteSubmission(id) { return this.request(`/staff/submissions/${id}/`, { method: 'DELETE' }); }

  // User Management (Staff and Students CRUD)
  async getUsers(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/admin/users/${query ? '?' + query : ''}`);
  }
  async getUserDetail(id) { return this.request(`/admin/users/${id}/`); }
  async createUser(data) { return this.request('/admin/users/', { method: 'POST', body: JSON.stringify(data) }); }
  async updateUser(id, data) { return this.request(`/admin/users/${id}/`, { method: 'PUT', body: JSON.stringify(data) }); }
  async deleteUser(id) { return this.request(`/admin/users/${id}/`, { method: 'DELETE' }); }
}

export const api = new AdminApiClient();
