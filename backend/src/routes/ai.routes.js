import { Router } from 'express';
import {
  createConversation,
  getConversation,
  sendMessage,
} from '../controllers/ai.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { validate } from '../middleware/validate.js';
import { postMessageSchema } from '../validators/ai.schemas.js';
import { aiMessageLimiter } from '../middleware/rateLimiters.js';

const router = Router();

// Protect all AI conversation routes: only authenticated students can interact with AI
router.use(requireAuth, requireRole('student'));

// POST /api/ai/conversations - Start a new event conversation
router.post('/conversations', createConversation);

// GET /api/ai/conversations/:conversationId - Get conversation history
router.get('/conversations/:conversationId', getConversation);

// POST /api/ai/conversations/:conversationId/messages - Send message to AI assistant
router.post(
  '/conversations/:conversationId/messages',
  aiMessageLimiter,
  validate(postMessageSchema),
  sendMessage
);

export default router;
