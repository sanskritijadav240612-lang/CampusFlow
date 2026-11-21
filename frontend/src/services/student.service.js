import api from './api';

/**
 * Service for student event request operations.
 */
export const studentService = {
  /**
   * Fetch authenticated student's request history
   * GET /api/requests/my?status=...&page=...&limit=...
   */
  async getMyRequests(params = {}) {
    const response = await api.get('/requests/my', { params });
    return response.data;
  },

  /**
   * Fetch single request details by ID
   * GET /api/requests/:requestId
   */
  async getRequestById(requestId) {
    const response = await api.get(`/requests/${requestId}`);
    return response.data;
  },

  /**
   * Check real-time resource availability
   * POST /api/requests/check-availability
   */
  async checkAvailability({ startAt, endAt, attendeeCount, requestedResources }) {
    const response = await api.post('/requests/check-availability', {
      startAt,
      endAt,
      attendeeCount: Number(attendeeCount),
      requestedResources: requestedResources.map((r) => ({
        resourceId: r.resourceId,
        requestedQuantity: r.requestedQuantity ? Number(r.requestedQuantity) : undefined,
      })),
    });
    return response.data;
  },

  /**
   * Submit a new student event request
   * POST /api/requests
   */
  async createEventRequest(payload) {
    const response = await api.post('/requests', {
      title: payload.title.trim(),
      description: payload.description.trim(),
      eventType: payload.eventType ? payload.eventType.trim() : '',
      startAt: payload.startAt,
      endAt: payload.endAt,
      attendeeCount: Number(payload.attendeeCount),
      requestedResources: payload.requestedResources.map((r) => ({
        resourceId: r.resourceId,
        requestedQuantity: r.requestedQuantity ? Number(r.requestedQuantity) : undefined,
      })),
      conversationId: payload.conversationId || undefined,
    });
    return response.data;
  },
};

export default studentService;
