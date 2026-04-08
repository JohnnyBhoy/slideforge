import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import passport from 'passport';

import { connectDB } from './config/db';
import { initPassport } from './config/passport';
import { errorHandler } from './middleware/errorHandler';

import authRoutes from './routes/auth.routes';
import generateRoutes from './routes/generate.routes';
import adminRoutes from './routes/admin.routes';
import notifyRoutes from './routes/notify.routes';
import settingsRoutes from './routes/settings.routes';

const app = express();

connectDB();
initPassport();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));
app.use(passport.initialize());

app.use('/files', express.static(path.join(__dirname, '../public/generated')));

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'Class Generator API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/generate', generateRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notify', notifyRoutes);
app.use('/api/settings', settingsRoutes);

app.use(errorHandler);

const PORT = parseInt(process.env.PORT || '5000', 10);
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
