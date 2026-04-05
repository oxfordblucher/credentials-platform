import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { getInvites, sendInvites, renewInvite, revokeInvite } from '../controllers/invite.ctrl.js';

const router = Router();
router.use(authenticate);
router.use(authorize);

router.post('/:teamId', sendInvites);
router.get('/', getInvites);
router.patch('/:id', renewInvite);
router.delete('/:id', revokeInvite);

export default router;