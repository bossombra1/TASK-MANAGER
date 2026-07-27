import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'API Task Manager opérationnelle' });
});

app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);

app.use('/api/comments', commentRoutes);
app.use('/api/notifications', notificationRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});