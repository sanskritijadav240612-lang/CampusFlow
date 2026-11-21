import { Router } from 'express';
import {
  checkAvailability,
  createRequest,
  getMyRequests,
  getRequestById,
} from '../controllers/request.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { validate } from '../middleware/validate.js';
import {
  checkAvailabilitySchema,
  createEventRequestSchema,
} from '../validators/request.schemas.js';

const router = Router();

// Protect all request endpoints: only authenticated students
router.use(requireAuth, requireRole('student'));

// POST /api/requests/check-availability - Check real-time resource availability
router.post(
  '/check-availability',
  validate(checkAvailabilitySchema),
  checkAvailability
);

// POST /api/requests - Create a new event request (status: 'Under Review')
router.post(
  '/',
  validate(createEventRequestSchema),
  createRequest
);

// GET /api/requests/my - List authenticated student's event requests
router.get(
  '/my',
  getMyRequests
);

// GET /api/requests/:requestId - Get details for an event request owned by the student
router.get(
  '/:requestId',
  getRequestById
);

export default router;
