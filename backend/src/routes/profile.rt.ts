import { Router } from 'express';
import { getProfile, editEmail, editName, editPassword, deleteProfile } from '../controllers/profile.ctrl.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', getProfile);
router.get('/:id', getProfile);
router.patch('/email', editEmail);
router.patch('/name', editName);
router.patch('/password', editPassword);
router.delete('/delete', deleteProfile);

export default router;