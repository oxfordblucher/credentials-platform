import express, { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { pinoHttp } from 'pino-http';
import authRouter from './routes/auth.rt.js';
import meRouter from './routes/me.rt.js';
import credentialRouter from './routes/credential.rt.js';
import teamRouter from './routes/team.rt.js';
import orgRouter from './routes/org.rt.js';
import inviteRouter from './routes/invite.rt.js';
import internalRouter from './routes/internal.rt.js';
import { errorHandler } from './middleware/error.js';
import cookieParser from 'cookie-parser';
import './events/listener.js';
import { logger } from './utils/logger.js';

export const app = express();

app.use(pinoHttp({ logger }));
app.use(express.json());
app.use(cookieParser());

const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
  skip: (req) => req.path.startsWith('/internal'),
});

const apiBase = '/api';

app.use(apiBase, globalLimiter);

app.use(apiBase + '/auth', authRouter);
app.use(apiBase + '/me', meRouter);
app.use(apiBase + '/credentials', credentialRouter);
app.use(apiBase + '/teams', teamRouter);
app.use(apiBase + '/orgs', orgRouter);
app.use(apiBase + '/invites', inviteRouter);
app.use(apiBase + '/internal', internalRouter);

app.get(apiBase + '/health', (_req: Request, res: Response) => {
  res.status(200).json({ message: 'Success' });
});

app.use(errorHandler);
