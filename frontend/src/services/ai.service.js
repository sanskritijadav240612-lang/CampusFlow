import api from './api';

/**
 * Service for student AI conversational coordinator.
 */
export const aiService = {
  /**
   * Start a new event conversation
   * POST /api/ai/conversations
   */
  async createConversation() {
    const response = await api.post('/ai/conversations');
    return response.data;
  },

  /**
   * Retrieve existing conversation by ID
   * GET /api/ai/conversations/:conversationId
   */
  async getConversation(conversationId) {
    const response = await api.get(`/ai/conversations/${conversationId}`);
    return response.data;
  },

  /**
   * Send a student message to the AI assistant
   * POST /api/ai/conversations/:conversationId/messages
   */
  async sendMessage(conversationId, content) {
    const response = await api.post(`/ai/conversations/${conversationId}/messages`, {
      content: content.trim(),
    });
    return response.data;
  },
};

export default aiService;
