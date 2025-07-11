
import express from 'express';
import { getDatabase } from '../database/connection';
import { authenticate, requireAdmin } from '../middleware/auth';
import { tenantIsolation } from '../middleware/tenantIsolation';
import { apiRateLimiter } from '../middleware/rateLimiter';
import { logger } from '../utils/logger';

const router = express.Router();

// Apply middleware
router.use(authenticate);
router.use(requireAdmin);
router.use(tenantIsolation);
router.use(apiRateLimiter);

// Get audit logs
router.get('/logs', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      action = '', 
      user_id = '', 
      date_from = '', 
      date_to = '' 
    } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const db = getDatabase();
    let query = db('audit_logs')
      .leftJoin('users', 'audit_logs.user_id', 'users.id')
      .select(
        'audit_logs.*',
        'users.full_name as user_name',
        'users.email as user_email'
      )
      .where('audit_logs.tenant_id', req.tenantId);

    if (action) {
      query = query.where('audit_logs.action', 'ilike', `%${action}%`);
    }

    if (user_id) {
      query = query.where('audit_logs.user_id', user_id);
    }

    if (date_from) {
      query = query.where('audit_logs.created_at', '>=', date_from);
    }

    if (date_to) {
      query = query.where('audit_logs.created_at', '<=', date_to);
    }

    const logs = await query
      .orderBy('audit_logs.created_at', 'desc')
      .limit(Number(limit))
      .offset(offset);

    const total = await db('audit_logs')
      .where('tenant_id', req.tenantId)
      .count('* as count')
      .first();

    res.json({
      logs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: Number(total?.count || 0),
        pages: Math.ceil(Number(total?.count || 0) / Number(limit))
      }
    });
  } catch (error) {
    logger.error('Get audit logs error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to fetch audit logs'
    });
  }
});

// Get system activities
router.get('/activities', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const db = getDatabase();

    const activities = await db('audit_logs')
      .leftJoin('users', 'audit_logs.user_id', 'users.id')
      .select(
        'audit_logs.action',
        'audit_logs.entity_type',
        'audit_logs.entity_id',
        'audit_logs.created_at',
        'users.full_name as user_name'
      )
      .where('audit_logs.tenant_id', req.tenantId)
      .orderBy('audit_logs.created_at', 'desc')
      .limit(Number(limit));

    res.json(activities);
  } catch (error) {
    logger.error('Get activities error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to fetch activities'
    });
  }
});

export default router;
