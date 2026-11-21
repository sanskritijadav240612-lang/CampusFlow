import api from './api';

/**
 * Service for campus resource inventory queries.
 */
export const resourceService = {
  /**
   * Get active campus resources
   * GET /api/resources?isActive=true&limit=100
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
};

export default resourceService;
