import { Router } from 'express';
import { getResources, createResource } from '../controllers/resource.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { validate } from '../middleware/validate.js';
import { createResourceSchema } from '../validators/resource.schemas.js';

const router = Router();

// Require authentication for all resource routes
router.use(requireAuth);

// GET /api/resources - Return resource inventory (authenticated students and faculty)
router.get('/', getResources);

// POST /api/resources - Add a capacity or quantity resource (faculty only)
router.post('/', requireRole('faculty'), validate(createResourceSchema), createResource);

export default router;
