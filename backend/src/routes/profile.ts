import { Router } from 'express';
import { getProfile, updateProfile, deleteProfile } from '../controllers/profile.js';

const router = Router();

router.get('/', getProfile);
router.put('/', updateProfile);
router.patch('/delete/:id', deleteProfile);

export default router;