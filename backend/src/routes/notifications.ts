
import express from 'express';
import Joi from 'joi';
import { getDatabase } from '../database/connection';
import { authenticate } from '../middleware/auth';
import { tenantIsolation } from '../middleware/tenantIsolation';
import { apiRateLimiter } from '../middleware/rateLimiter';
import { logger } from '../utils/logger';

const router = express.Router();

// Apply middleware
router.use(authenticate);
router.use(tenantIsolation);
router.use(apiRateLimiter);

// Validation schemas
const notificationSchema = Joi.object({
  type: Joi.string().valid('info', 'warning', 'error', 'success').required(),
  category: Joi.string().valid('system', 'inventory', 'invoice', 'user', 'payment').required(),
  title: Joi.string().min(1).max(255).required(),
  message: Joi.string().min(1).max(1000).required(),
  priority: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium'),
  user_id: Joi.string().uuid().optional(),
  entity_type: Joi.string().optional(),
  entity_id: Joi.string().uuid().optional(),
  action_url: Joi.string().max(500).optional(),
  expires_at: Joi.date().optional()
});

// Get all notifications for user/tenant
router.get('/', async (req, res) => {
  try {
    const db = getDatabase();
    const { 
      page = 1, 
      limit = 50, 
      unread_only = 'false',
      type = '',
      category = '',
      priority = ''
    } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = db('notifications')
      .where('tenant_id', req.tenantId)
      .where(builder => {
        builder
          .where('user_id', req.user?.userId)
          .orWhereNull('user_id'); // Global notifications
      })
      .where(builder => {
        builder
          .whereNull('expires_at')
          .orWhere('expires_at', '>', new Date());
      });

    if (unread_only === 'true') {
      query = query.where('is_read', false);
    }

    if (type) {
      query = query.where('type', type);
    }

    if (category) {
      query = query.where('category', category);
    }

    if (priority) {
      query = query.where('priority', priority);
    }

    const notifications = await query
      .orderBy('created_at', 'desc')
      .limit(Number(limit))
      .offset(offset);

    const total = await db('notifications')
      .where('tenant_id', req.tenantId)
      .where(builder => {
        builder
          .where('user_id', req.user?.userId)
          .orWhereNull('user_id');
      })
      .count('* as count')
      .first();

    const unreadCount = await db('notifications')
      .where('tenant_id', req.tenantId)
      .where(builder => {
        builder
          .where('user_id', req.user?.userId)
          .orWhereNull('user_id');
      })
      .where('is_read', false)
      .count('* as count')
      .first();

    res.json({
      notifications,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: Number(total?.count || 0),
        pages: Math.ceil(Number(total?.count || 0) / Number(limit))
      },
      unreadCount: Number(unreadCount?.count || 0)
    });
  } catch (error) {
    logger.error('Get notifications error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to fetch notifications'
    });
  }
});

// Create notification
router.post('/', async (req, res) => {
  try {
    const { error } = notificationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.details[0].message
      });
    }

    const db = getDatabase();
    const [notification] = await db('notifications')
      .insert({
        ...req.body,
        tenant_id: req.tenantId,
        created_by: req.user?.userId,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning('*');

    logger.info(`Notification created: ${notification.title}`);
    res.status(201).json(notification);
  } catch (error) {
    logger.error('Create notification error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to create notification'
    });
  }
});

// Mark notification as read
router.patch('/:id/read', async (req, res) => {
  try {
    const db = getDatabase();
    const [notification] = await db('notifications')
      .where({ 
        id: req.params.id, 
        tenant_id: req.tenantId 
      })
      .where(builder => {
        builder
          .where('user_id', req.user?.userId)
          .orWhereNull('user_id');
      })
      .update({
        is_read: true,
        read_at: new Date(),
        updated_at: new Date()
      })
      .returning('*');

    if (!notification) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Notification not found'
      });
    }

    res.json(notification);
  } catch (error) {
    logger.error('Mark notification read error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to mark notification as read'
    });
  }
});

// Mark all notifications as read
router.patch('/read-all', async (req, res) => {
  try {
    const db = getDatabase();
    await db('notifications')
      .where('tenant_id', req.tenantId)
      .where(builder => {
        builder
          .where('user_id', req.user?.userId)
          .orWhereNull('user_id');
      })
      .where('is_read', false)
      .update({
        is_read: true,
        read_at: new Date(),
        updated_at: new Date()
      });

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    logger.error('Mark all notifications read error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to mark all notifications as read'
    });
  }
});

// Delete notification
router.delete('/:id', async (req, res) => {
  try {
    const db = getDatabase();
    const deletedCount = await db('notifications')
      .where({ 
        id: req.params.id, 
        tenant_id: req.tenantId 
      })
      .where(builder => {
        builder
          .where('user_id', req.user?.userId)
          .orWhereNull('user_id');
      })
      .del();

    if (deletedCount === 0) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Notification not found'
      });
    }

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    logger.error('Delete notification error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to delete notification'
    });
  }
});

export default router;
