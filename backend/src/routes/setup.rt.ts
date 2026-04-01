import { Router } from 'express';
import { createOrganization, createInvite, refreshInvite } from "../controllers/setup.ctrl.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();

router.post('/org', createOrganization);
router.post('/invite', authenticate, authorize(), createInvite);
router.put('/invite/:id', authenticate, authorize(), refreshInvite);

export default router;