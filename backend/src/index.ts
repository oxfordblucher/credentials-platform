import express, { Request, Response } from 'express';
import authRouter from './routes/auth.js';
import profileRouter from './routes/profile.js';
import notificationRouter from './routes/notification.js';
import credentialRouter from './routes/credential.js';
import sessionRouter from './routes/session.js';
import setupRouter from './routes/setup.js';
import { errorHandler } from './middleware/error.js';

const app = express();
const port = 3000;

app.use(express.json());

const apiBase = '/api';

app.use(apiBase + '/auth', authRouter);
app.use(apiBase + '/profile', profileRouter);
app.use(apiBase + '/notification', notificationRouter);
app.use(apiBase + '/credential', credentialRouter);
app.use(apiBase + '/session', sessionRouter);
app.use(apiBase + '/setup', setupRouter);

app.get(apiBase + '/health', (req: Request, res: Response) => {
    res.status(200).json({
      message: 'Success'
    });
})

app.use(errorHandler);

app.listen(port, () => {
    console.log(`Server listening on port: ${port}`);
})