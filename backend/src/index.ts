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

const app = express();
const port = 3000;

app.use(express.json());
app.use(cookieParser());

const apiBase = '/api';

app.use(apiBase + '/auth', authRouter);
app.use(apiBase + '/profile', profileRouter);
app.use(apiBase + '/notification', notificationRouter);
app.use(apiBase + '/credential', credentialRouter);
app.use(apiBase + '/session', sessionRouter);
app.use(apiBase + '/team', teamRouter);
app.use(apiBase + '/org', orgRouter);

app.get(apiBase + '/health', (req: Request, res: Response) => {
    res.status(200).json({
      message: 'Success'
    });
})

app.use(errorHandler);

app.listen(port, () => {
    console.log(`Server listening on port: ${port}`);
})