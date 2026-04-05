import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { getTeams, createTeam, removeTeam, createOrg } from '../controllers/org.ctrl.js';

const router = Router();

router.post('/', createOrg);
router.use(authenticate);
router.use(authorize);

router.get('/', getTeams);
router.post('/create', createTeam);
router.delete('/delete/:teamId', removeTeam);

export default router;