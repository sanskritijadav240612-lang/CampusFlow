import api from './api';

/**
 * Service for campus resource inventory queries and administrative management.
 */
export const resourceService = {
  /**
   * Get filtered campus resources
   * GET /api/resources?category=...&resourceMode=...&isActive=...&search=...&page=...&limit=...
   */
  async getResources(params = {}) {
    const response = await api.get('/resources', { params });
    return response.data;
  },

  /**
   * Get active campus resources (for dropdowns / quick selects)
   */
  async getActiveResources(params = {}) {
    const response = await api.get('/resources', {
      params: {
        isActive: 'true',
        limit: 100,
        ...params,
      },
    });
    return response.data;
  },

  /**
   * Create a new campus resource (faculty only)
   * POST /api/resources
   */
  async createResource(data) {
    const payload = {
      name: data.name.trim(),
      category: data.category.trim(),
      resourceMode: data.resourceMode,
      description: (data.description || '').trim(),
      location: (data.location || '').trim(),
    };

    if (data.resourceMode === 'capacity') {
      payload.capacity = Number(data.capacity);
    } else {
      payload.totalQuantity = Number(data.totalQuantity);
    }

    const response = await api.post('/resources', payload);
    return response.data;
  },
};

export default resourceService;
