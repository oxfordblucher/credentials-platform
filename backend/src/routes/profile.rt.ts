import { Router } from 'express';
import { getProfile, updateEmail, updateName, updatePassword, deleteProfile } from '../controllers/profile.ctrl.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', getProfile);
router.get('/:id', getProfile);
router.patch('/email', updateEmail);
router.patch('/name', updateName);
router.patch('/password', updatePassword);
router.delete('/delete', deleteProfile);

export default router;