import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { getTeams, createTeam, removeTeam, setupOrg } from '../controllers/org.ctrl.js';

const router = Router();

router.post('/', setupOrg);
router.use(authenticate);
router.use(authorize);

router.get('/teams', getTeams);
router.post('/teams', createTeam);
router.delete('/teams/:teamId', removeTeam);

export default router;