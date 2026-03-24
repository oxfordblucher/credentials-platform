import { Router } from 'express';
import { registerUser, loginUser, logoutUser, refreshToken } from '../controllers/auth.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.delete('/logout', authenticate, logoutUser);
router.post('/refresh', refreshToken);

export default router;