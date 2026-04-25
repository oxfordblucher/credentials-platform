import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { getInvites, sendInvites, renewInvite, revokeInvite } from '../controllers/invite.ctrl.js';

const router = Router();
router.use(authenticate);

router.get('/', getInvites);

router.use(authorize);

router.post('/teams/:teamId', sendInvites);
router.patch('/teams/:teamId/:id', renewInvite);
router.delete('/teams/:teamId/:id', revokeInvite);

export default router;