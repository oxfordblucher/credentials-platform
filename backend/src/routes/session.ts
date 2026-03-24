import { Router } from 'express';
import { getSessions, revokeSession, revokeOtherSessions, revokeAllSessions } from '../controllers/session.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', getSessions);
router.delete('/:id', revokeSession);
router.delete('/other', revokeOtherSessions);
router.delete('/', revokeAllSessions);

export default router;