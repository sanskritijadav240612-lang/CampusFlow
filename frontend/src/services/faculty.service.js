import api from './api';

/**
 * Service for faculty portal operations.
 */
export const facultyService = {
  /**
   * Fetch faculty dashboard overview statistics
   * GET /api/faculty/dashboard
   */
  async getDashboard() {
    const response = await api.get('/faculty/dashboard');
    return response.data;
  },

  /**
   * List faculty request inbox with filters and search
   * GET /api/faculty/requests?status=...&page=...&limit=...&search=...
   */
  async getRequests(params = {}) {
    const response = await api.get('/faculty/requests', { params });
    return response.data;
  },

  /**
   * Get single event request details
   * GET /api/faculty/requests/:requestId
   */
  async getRequestDetails(requestId) {
    const response = await api.get(`/faculty/requests/${requestId}`);
    return response.data;
  },

  /**
   * Detect overlapping allocations and competing pending requests
   * GET /api/faculty/requests/:requestId/conflicts
   */
  async getRequestConflicts(requestId) {
    const response = await api.get(`/faculty/requests/${requestId}/conflicts`);
    return response.data;
  },

  /**
   * Atomically approve an event request
   * PATCH /api/faculty/requests/:requestId/approve
   */
  async approveRequest(requestId, decisionRemark = '') {
    const response = await api.patch(`/faculty/requests/${requestId}/approve`, {
      decisionRemark: decisionRemark.trim(),
    });
    return response.data;
  },

  /**
   * Reject an event request
   * PATCH /api/faculty/requests/:requestId/reject
   */
  async rejectRequest(requestId, decisionRemark = '') {
    const response = await api.patch(`/faculty/requests/${requestId}/reject`, {
      decisionRemark: decisionRemark.trim(),
    });
    return response.data;
  },

  /**
   * Get notification delivery history
   * GET /api/faculty/notifications?status=...&type=...&page=...&limit=...
   */
  async getNotifications(params = {}) {
    const response = await api.get('/faculty/notifications', { params });
    return response.data;
  },

  /**
   * Retry a pending or failed notification
   * POST /api/faculty/notifications/:notificationId/retry
   */
  async retryNotification(notificationId) {
    const response = await api.post(`/faculty/notifications/${notificationId}/retry`);
    return response.data;
  },
};

export default facultyService;
