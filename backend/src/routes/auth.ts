import { Router } from 'express';
import { registerUser, loginUser, logoutUser } from '../controllers/auth.js';

const authRouter = Router();

authRouter.post('/register', registerUser);
authRouter.post('/login', loginUser);
authRouter.post('/logout', logoutUser);

export default authRouter;