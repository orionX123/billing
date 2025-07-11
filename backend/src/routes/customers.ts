
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
const customerSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  email: Joi.string().email().optional().allow(''),
  phone: Joi.string().max(20).optional().allow(''),
  address: Joi.string().max(500).optional().allow(''),
  panNumber: Joi.string().max(20).optional().allow(''),
  vatNumber: Joi.string().max(20).optional().allow(''),
  contactPerson: Joi.string().max(255).optional().allow(''),
  creditLimit: Joi.number().min(0).default(0),
  paymentTerms: Joi.string().max(100).default('Net 30'),
  isActive: Joi.boolean().default(true),
});

// Get all customers
router.get('/', async (req, res) => {
  try {
    const db = getDatabase();
    const { page = 1, limit = 50, search = '', status = 'all' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = db('customers')
      .where('tenant_id', req.tenantId);

    if (search) {
      query = query.where(builder => {
        builder
          .where('name', 'ilike', `%${search}%`)
          .orWhere('email', 'ilike', `%${search}%`)
          .orWhere('phone', 'ilike', `%${search}%`);
      });
    }

    if (status !== 'all') {
      query = query.where('is_active', status === 'active');
    }

    const customers = await query
      .orderBy('created_at', 'desc')
      .limit(Number(limit))
      .offset(offset);

    const total = await db('customers')
      .where('tenant_id', req.tenantId)
      .count('* as count')
      .first();

    res.json({
      customers,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: Number(total?.count || 0),
        pages: Math.ceil(Number(total?.count || 0) / Number(limit))
      }
    });
  } catch (error) {
    logger.error('Get customers error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to fetch customers'
    });
  }
});

// Get customer by ID
router.get('/:id', async (req, res) => {
  try {
    const db = getDatabase();
    const customer = await db('customers')
      .where({ id: req.params.id, tenant_id: req.tenantId })
      .first();

    if (!customer) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Customer not found'
      });
    }

    res.json(customer);
  } catch (error) {
    logger.error('Get customer error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to fetch customer'
    });
  }
});

// Create customer
router.post('/', async (req, res) => {
  try {
    const { error } = customerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.details[0].message
      });
    }

    const db = getDatabase();
    const [customer] = await db('customers')
      .insert({
        ...req.body,
        tenant_id: req.tenantId,
        created_by: req.user?.userId,
        updated_by: req.user?.userId,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning('*');

    logger.info(`Customer created: ${customer.name}`);
    res.status(201).json(customer);
  } catch (error) {
    logger.error('Create customer error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to create customer'
    });
  }
});

// Update customer
router.put('/:id', async (req, res) => {
  try {
    const { error } = customerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.details[0].message
      });
    }

    const db = getDatabase();
    const [customer] = await db('customers')
      .where({ id: req.params.id, tenant_id: req.tenantId })
      .update({
        ...req.body,
        updated_by: req.user?.userId,
        updated_at: new Date()
      })
      .returning('*');

    if (!customer) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Customer not found'
      });
    }

    logger.info(`Customer updated: ${customer.name}`);
    res.json(customer);
  } catch (error) {
    logger.error('Update customer error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to update customer'
    });
  }
});

// Delete customer
router.delete('/:id', async (req, res) => {
  try {
    const db = getDatabase();
    const [customer] = await db('customers')
      .where({ id: req.params.id, tenant_id: req.tenantId })
      .update({
        is_active: false,
        updated_by: req.user?.userId,
        updated_at: new Date()
      })
      .returning('*');

    if (!customer) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Customer not found'
      });
    }

    logger.info(`Customer deleted: ${customer.name}`);
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    logger.error('Delete customer error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to delete customer'
    });
  }
});

export default router;
