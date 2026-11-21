import { Router } from 'express';
import { getResources, createResource } from '../controllers/resource.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { validate } from '../middleware/validate.js';
import { createResourceSchema } from '../validators/resource.schemas.js';

const router = Router();

// Protect all resource management routes: authenticated faculty only
router.use(requireAuth, requireRole('faculty'));

// GET /api/resources - Return resource inventory
router.get('/', getResources);

// POST /api/resources - Add a capacity or quantity resource
router.post('/', validate(createResourceSchema), createResource);

export default router;
