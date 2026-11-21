import { Router } from 'express';
import {
  getDashboard,
  getRequests,
  getRequestDetails,
  getRequestConflicts,
  approveRequest,
  rejectRequest,
  getNotifications,
  retryNotificationHandler,
} from '../controllers/faculty.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { validate } from '../middleware/validate.js';
import { decisionRemarkSchema } from '../validators/faculty.schemas.js';

const router = Router();

// Protect all faculty routes: strictly require authenticated faculty role
router.use(requireAuth, requireRole('faculty'));

// Feature 18: Faculty Dashboard API
router.get('/dashboard', getDashboard);

// Feature 19: Faculty Request Inbox & History
router.get('/requests', getRequests);

// Feature 19: Event Request Details
router.get('/requests/:requestId', getRequestDetails);

// Feature 19: Conflict Detection & Overlapping Allocations
router.get('/requests/:requestId/conflicts', getRequestConflicts);

// Feature 20: Atomically Approve Event Request
router.patch(
  '/requests/:requestId/approve',
  validate(decisionRemarkSchema),
  approveRequest
);

// Feature 21: Reject Event Request
router.patch(
  '/requests/:requestId/reject',
  validate(decisionRemarkSchema),
  rejectRequest
);

// Feature 23: Notification Delivery History
router.get('/notifications', getNotifications);

// Feature 23: Retry Failed or Pending Notification
router.post('/notifications/:notificationId/retry', retryNotificationHandler);

export default router;
