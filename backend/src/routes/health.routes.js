import { Router } from 'express';
import { getDbStatus } from '../config/db.js';

const router = Router();

router.get('/health', (req, res) => {
  const dbStatus = getDbStatus();
  const isHealthy = dbStatus.isConnected;

  const healthData = {
    server: 'up',
    database: dbStatus.state,
    timestamp: new Date().toISOString(),
  };

  return res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    ...healthData,
  });
});

export default router;
