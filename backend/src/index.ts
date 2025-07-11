
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { authMiddleware } from './middleware/authMiddleware';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { logger } from './utils/logger';
import { connectDatabase } from './database/connection';
import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import tenantsRoutes from './routes/tenants';
import customersRoutes from './routes/customers';
import productsRoutes from './routes/products';
import invoicesRoutes from './routes/invoices';
import reportsRoutes from './routes/reports';
import settingsRoutes from './routes/settings';
import auditRoutes from './routes/audit';
import backupRoutes from './routes/backup';
import notificationsRoutes from './routes/notifications';
import connectorsRoutes from './routes/connectors';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Auth middleware (applied to all routes except public ones)
app.use(authMiddleware);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/tenants', tenantsRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/connectors', connectorsRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Initialize database and start server
const startServer = async () => {
  try {
    await connectDatabase();
    logger.info('Database connected successfully');
    
    app.listen(port, () => {
      logger.info(`Server is running on port ${port}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown handling
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

startServer();
