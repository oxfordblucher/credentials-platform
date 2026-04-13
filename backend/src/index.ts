import express, { Request, Response } from 'express';
import authRouter from './routes/auth.rt.js';
import profileRouter from './routes/profile.rt.js';
import notificationRouter from './routes/notification.rt.js';
import credentialRouter from './routes/credential.rt.js';
import sessionRouter from './routes/session.rt.js';
import teamRouter from './routes/team.rt.js';
import orgRouter from './routes/org.rt.js';
import inviteRouter from './routes/invite.rt.js';
import { errorHandler } from './middleware/error.js';
import cookieParser from 'cookie-parser';
import './events/listener.js';

const app = express();
const port = 3000;

app.use(express.json());
app.use(cookieParser());

const apiBase = '/api';

app.use(apiBase + '/auth', authRouter);
app.use(apiBase + '/profiles', profileRouter);
app.use(apiBase + '/notifications', notificationRouter);
app.use(apiBase + '/credentials', credentialRouter);
app.use(apiBase + '/sessions', sessionRouter);
app.use(apiBase + '/teams', teamRouter);
app.use(apiBase + '/orgs', orgRouter);
app.use(apiBase + '/invites', inviteRouter);

app.get(apiBase + '/health', (req: Request, res: Response) => {
    res.status(200).json({
      message: 'Success'
    });
})

app.use(errorHandler);

app.listen(port, () => {
    console.log(`Server listening on port: ${port}`);
})