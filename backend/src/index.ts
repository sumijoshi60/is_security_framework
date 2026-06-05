import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import domainRoutes from './routes/domains.routes';
import assessmentRoutes from './routes/assessments.routes';
import responseRoutes from './routes/responses.routes';
import userRoutes from './routes/users.routes';
import adminRoutes from './routes/admin.routes';
import templateRoutes from './routes/templates.routes';
import evidenceRoutes from './routes/evidence.routes';
import actionItemRoutes from './routes/action-items.routes';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/domains', domainRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/assessments', responseRoutes);
app.use('/api/assessments', evidenceRoutes);
app.use('/api/assessments', actionItemRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/templates', templateRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`ISMS Backend running on http://localhost:${PORT}`);
});
