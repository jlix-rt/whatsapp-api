import { Router } from 'express';

const router = Router();

// Endpoint básico de autenticación/health check
router.get('/health', (_, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

export default router;

