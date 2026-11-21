import api from './api';

/**
 * Service methods connecting to CampusFlow Express backend authentication APIs.
 */
export const authService = {
  /**
   * Register a new student account
   * POST /api/auth/student/register
   */
  async registerStudent({ name, email, enrollmentNumber, password }) {
    const response = await api.post('/auth/student/register', {
      name,
      email,
      enrollmentNumber,
      password,
    });
    return response.data;
  },

  /**
   * Student Login
   * POST /api/auth/student/login
   */
  async loginStudent({ email, password }) {
    const response = await api.post('/auth/student/login', {
      email,
      password,
    });
    return response.data;
  },

  /**
   * Faculty / Admin Login
   * POST /api/auth/faculty/login
   */
  async loginFaculty({ identifier, password }) {
    const response = await api.post('/auth/faculty/login', {
      identifier,
      password,
    });
    return response.data;
  },

  /**
   * Refresh session and retrieve new access token
   * POST /api/auth/refresh
   */
  async refreshToken() {
    const response = await api.post('/auth/refresh');
    return response.data;
  },

  /**
   * Revoke session and clear HTTP-only refresh cookie
   * POST /api/auth/logout
   */
  async logout() {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  /**
   * Fetch current authenticated user profile
   * GET /api/auth/me
   */
  async getCurrentUser() {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

export default authService;
