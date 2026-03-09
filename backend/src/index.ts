import express, { Request, Response } from 'express';
import authRouter from './routes/auth.js';
import profileRouter from './routes/profile.js';
import notificationRouter from './routes/notification.js';

const app = express();
const port = 3000;

const apiBase = '/api';

app.use(apiBase + '/auth', authRouter);
app.use(apiBase + '/profile', profileRouter);
app.use(apiBase + '/notification', notificationRouter);

app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
      message: 'Success'
    });
})

app.listen(port, () => {
    console.log(`Server listening on port: ${port}`);
})