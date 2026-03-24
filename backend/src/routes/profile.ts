import { Router } from 'express';
import { getProfile, updateProfile, deleteProfile } from '../controllers/profile.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', getProfile);
router.put('/', updateProfile);
router.patch('/delete/:id', deleteProfile);

export default router;