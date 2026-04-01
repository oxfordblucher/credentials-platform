import { Router } from 'express';
import { registerUser, loginUser, logoutUser, refreshTokens } from '../controllers/auth.ctrl.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.delete('/logout', authenticate, logoutUser);
router.post('/refresh', refreshTokens);

export default router;