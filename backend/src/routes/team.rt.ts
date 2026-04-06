import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { getStaff, addStaff, removeStaff } from '../controllers/team.ctrl.js';

const router = Router();
router.use(authenticate);
router.use(authorize);

router.get('/', getStaff);
router.patch('/:teamId/add/:userId', addStaff);
router.delete('/:teamId/delete/:userId', removeStaff);

export default router;