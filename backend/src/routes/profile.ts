import { Router } from 'express';
import { getProfile, updateProfile, deleteProfile } from '../controllers/profile.js';

const profileRouter = Router();

profileRouter.get('/', getProfile);
profileRouter.put('/', updateProfile);
profileRouter.patch('/delete', deleteProfile);

export default profileRouter;