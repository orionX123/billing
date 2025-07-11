
import express from 'express';
import Joi from 'joi';
import { getDatabase } from '../database/connection';
import { authenticate, requireSuperAdmin } from '../middleware/auth';
import { apiRateLimiter } from '../middleware/rateLimiter';
import { logger } from '../utils/logger';

const router = express.Router();

// Apply middleware
router.use(authenticate);
router.use(apiRateLimiter);

// Validation schemas
const tenantSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().max(20).optional().allow(''),
  address: Joi.string().max(500).optional().allow(''),
  panNumber: Joi.string().max(20).optional().allow(''),
  vatNumber: Joi.string().max(20).optional().allow(''),
  subscriptionPlan: Joi.string().valid('basic', 'standard', 'premium').default('basic'),
  maxUsers: Joi.number().min(1).default(5),
  features: Joi.array().items(Joi.string()).default([]),
  status: Joi.string().valid('active', 'inactive', 'suspended').default('active'),
});

// Get all tenants (Super Admin only)
router.get('/', requireSuperAdmin, async (req, res) => {
  try {
    const db = getDatabase();
    const { page = 1, limit = 50, search = '', status = 'all' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = db('tenants');

    if (search) {
      query = query.where(builder => {
        builder
          .where('name', 'ilike', `%${search}%`)
          .orWhere('email', 'ilike', `%${search}%`);
      });
    }

    if (status !== 'all') {
      query = query.where('status', status);
    }

    const tenants = await query
      .orderBy('created_at', 'desc')
      .limit(Number(limit))
      .offset(offset);

    const total = await db('tenants')
      .count('* as count')
      .first();

    res.json({
      tenants,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: Number(total?.count || 0),
        pages: Math.ceil(Number(total?.count || 0) / Number(limit))
      }
    });
  } catch (error) {
    logger.error('Get tenants error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to fetch tenants'
    });
  }
});

// Get tenant by ID
router.get('/:id', requireSuperAdmin, async (req, res) => {
  try {
    const db = getDatabase();
    const tenant = await db('tenants')
      .where('id', req.params.id)
      .first();

    if (!tenant) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Tenant not found'
      });
    }

    // Get tenant statistics
    const stats = await Promise.all([
      db('users').where('tenant_id', req.params.id).count('* as count').first(),
      db('customers').where('tenant_id', req.params.id).count('* as count').first(),
      db('products').where('tenant_id', req.params.id).count('* as count').first(),
      db('invoices').where('tenant_id', req.params.id).count('* as count').first(),
    ]);

    res.json({
      ...tenant,
      stats: {
        users: Number(stats[0]?.count || 0),
        customers: Number(stats[1]?.count || 0),
        products: Number(stats[2]?.count || 0),
        invoices: Number(stats[3]?.count || 0),
      }
    });
  } catch (error) {
    logger.error('Get tenant error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to fetch tenant'
    });
  }
});

// Create tenant (Super Admin only)
router.post('/', requireSuperAdmin, async (req, res) => {
  try {
    const { error } = tenantSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.details[0].message
      });
    }

    const db = getDatabase();
    
    // Check if tenant with email already exists
    const existingTenant = await db('tenants')
      .where('email', req.body.email)
      .first();

    if (existingTenant) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Tenant with this email already exists'
      });
    }

    const [tenant] = await db('tenants')
      .insert({
        ...req.body,
        created_by: req.user?.userId,
        updated_by: req.user?.userId,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning('*');

    logger.info(`Tenant created: ${tenant.name}`);
    res.status(201).json(tenant);
  } catch (error) {
    logger.error('Create tenant error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to create tenant'
    });
  }
});

// Update tenant (Super Admin only)
router.put('/:id', requireSuperAdmin, async (req, res) => {
  try {
    const { error } = tenantSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.details[0].message
      });
    }

    const db = getDatabase();
    const [tenant] = await db('tenants')
      .where('id', req.params.id)
      .update({
        ...req.body,
        updated_by: req.user?.userId,
        updated_at: new Date()
      })
      .returning('*');

    if (!tenant) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Tenant not found'
      });
    }

    logger.info(`Tenant updated: ${tenant.name}`);
    res.json(tenant);
  } catch (error) {
    logger.error('Update tenant error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to update tenant'
    });
  }
});

// Delete tenant (Super Admin only)
router.delete('/:id', requireSuperAdmin, async (req, res) => {
  try {
    const db = getDatabase();
    
    // Check if tenant has users or data
    const hasUsers = await db('users')
      .where('tenant_id', req.params.id)
      .count('* as count')
      .first();

    if (Number(hasUsers?.count || 0) > 0) {
      return res.status(400).json({
        error: 'Cannot delete',
        message: 'Tenant has associated users. Please remove all users first.'
      });
    }

    const [tenant] = await db('tenants')
      .where('id', req.params.id)
      .update({
        status: 'inactive',
        updated_by: req.user?.userId,
        updated_at: new Date()
      })
      .returning('*');

    if (!tenant) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Tenant not found'
      });
    }

    logger.info(`Tenant deactivated: ${tenant.name}`);
    res.json({ message: 'Tenant deactivated successfully' });
  } catch (error) {
    logger.error('Delete tenant error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to delete tenant'
    });
  }
});

export default router;
