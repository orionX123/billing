
import express from 'express';
import bcrypt from 'bcryptjs';
import Joi from 'joi';
import { getDatabase } from '../database/connection';
import { authenticate, requireAdmin } from '../middleware/auth';
import { tenantIsolation } from '../middleware/tenantIsolation';
import { apiRateLimiter } from '../middleware/rateLimiter';
import { logger } from '../utils/logger';

const router = express.Router();

// Apply middleware
router.use(authenticate);
router.use(apiRateLimiter);

// Validation schemas
const userSchema = Joi.object({
  email: Joi.string().email().required(),
  fullName: Joi.string().min(2).max(255).required(),
  role: Joi.string().valid('staff', 'manager', 'admin').required(),
  isActive: Joi.boolean().default(true),
});

const passwordSchema = Joi.object({
  currentPassword: Joi.string().min(6).required(),
  newPassword: Joi.string().min(6).required(),
});

// Get all users (Admin only, tenant isolated)
router.get('/', requireAdmin, tenantIsolation, async (req, res) => {
  try {
    const db = getDatabase();
    const { page = 1, limit = 50, search = '', role = 'all', status = 'all' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = db('users')
      .leftJoin('tenants', 'users.tenant_id', 'tenants.id')
      .select(
        'users.*',
        'tenants.name as tenant_name'
      );

    // Super admins see all users, others see only their tenant
    if (req.user?.role !== 'superadmin') {
      query = query.where('users.tenant_id', req.tenantId);
    }

    if (search) {
      query = query.where(builder => {
        builder
          .where('users.full_name', 'ilike', `%${search}%`)
          .orWhere('users.email', 'ilike', `%${search}%`);
      });
    }

    if (role !== 'all') {
      query = query.where('users.role', role);
    }

    if (status !== 'all') {
      query = query.where('users.is_active', status === 'active');
    }

    const users = await query
      .orderBy('users.created_at', 'desc')
      .limit(Number(limit))
      .offset(offset);

    const total = await db('users')
      .where(req.user?.role !== 'superadmin' ? { tenant_id: req.tenantId } : {})
      .count('* as count')
      .first();

    // Remove password hashes from response
    const sanitizedUsers = users.map(user => {
      const { password_hash, ...safeUser } = user;
      return safeUser;
    });

    res.json({
      users: sanitizedUsers,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: Number(total?.count || 0),
        pages: Math.ceil(Number(total?.count || 0) / Number(limit))
      }
    });
  } catch (error) {
    logger.error('Get users error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to fetch users'
    });
  }
});

// Get current user profile
router.get('/profile', async (req, res) => {
  try {
    const db = getDatabase();
    const user = await db('users')
      .leftJoin('tenants', 'users.tenant_id', 'tenants.id')
      .select(
        'users.id',
        'users.email',
        'users.full_name',
        'users.role',
        'users.tenant_id',
        'users.is_active',
        'users.last_login',
        'users.created_at',
        'tenants.name as tenant_name'
      )
      .where('users.id', req.user?.userId)
      .first();

    if (!user) {
      return res.status(404).json({
        error: 'Not found',
        message: 'User not found'
      });
    }

    res.json(user);
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to fetch profile'
    });
  }
});

// Update current user profile
router.put('/profile', async (req, res) => {
  try {
    const updateSchema = Joi.object({
      fullName: Joi.string().min(2).max(255).required(),
    });

    const { error } = updateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.details[0].message
      });
    }

    const db = getDatabase();
    const [user] = await db('users')
      .where('id', req.user?.userId)
      .update({
        full_name: req.body.fullName,
        updated_at: new Date()
      })
      .returning(['id', 'email', 'full_name', 'role', 'tenant_id']);

    logger.info(`Profile updated: ${user.email}`);
    res.json(user);
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to update profile'
    });
  }
});

// Change password
router.put('/password', async (req, res) => {
  try {
    const { error } = passwordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.details[0].message
      });
    }

    const { currentPassword, newPassword } = req.body;
    const db = getDatabase();

    const user = await db('users')
      .where('id', req.user?.userId)
      .first();

    if (!user || !await bcrypt.compare(currentPassword, user.password_hash)) {
      return res.status(400).json({
        error: 'Invalid password',
        message: 'Current password is incorrect'
      });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    await db('users')
      .where('id', req.user?.userId)
      .update({
        password_hash: newPasswordHash,
        updated_at: new Date()
      });

    logger.info(`Password changed: ${user.email}`);
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to change password'
    });
  }
});

// Create user (Admin only)
router.post('/', requireAdmin, tenantIsolation, async (req, res) => {
  try {
    const createSchema = userSchema.concat(Joi.object({
      password: Joi.string().min(6).required(),
    }));

    const { error } = createSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.details[0].message
      });
    }

    const { email, password, fullName, role, isActive } = req.body;
    const db = getDatabase();

    // Check if user already exists
    const existingUser = await db('users').where('email', email).first();
    if (existingUser) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'User with this email already exists'
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [user] = await db('users')
      .insert({
        email,
        password_hash: passwordHash,
        full_name: fullName,
        role,
        tenant_id: req.tenantId,
        is_active: isActive,
        created_by: req.user?.userId,
        updated_by: req.user?.userId,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning(['id', 'email', 'full_name', 'role', 'tenant_id', 'is_active']);

    logger.info(`User created: ${user.email}`);
    res.status(201).json(user);
  } catch (error) {
    logger.error('Create user error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to create user'
    });
  }
});

// Update user (Admin only)
router.put('/:id', requireAdmin, tenantIsolation, async (req, res) => {
  try {
    const { error } = userSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.details[0].message
      });
    }

    const db = getDatabase();
    const whereClause = req.user?.role === 'superadmin' 
      ? { id: req.params.id }
      : { id: req.params.id, tenant_id: req.tenantId };

    const [user] = await db('users')
      .where(whereClause)
      .update({
        email: req.body.email,
        full_name: req.body.fullName,
        role: req.body.role,
        is_active: req.body.isActive,
        updated_by: req.user?.userId,
        updated_at: new Date()
      })
      .returning(['id', 'email', 'full_name', 'role', 'tenant_id', 'is_active']);

    if (!user) {
      return res.status(404).json({
        error: 'Not found',
        message: 'User not found'
      });
    }

    logger.info(`User updated: ${user.email}`);
    res.json(user);
  } catch (error) {
    logger.error('Update user error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to update user'
    });
  }
});

// Delete user (Admin only)
router.delete('/:id', requireAdmin, tenantIsolation, async (req, res) => {
  try {
    const db = getDatabase();
    const whereClause = req.user?.role === 'superadmin' 
      ? { id: req.params.id }
      : { id: req.params.id, tenant_id: req.tenantId };

    const [user] = await db('users')
      .where(whereClause)
      .update({
        is_active: false,
        updated_by: req.user?.userId,
        updated_at: new Date()
      })
      .returning(['id', 'email']);

    if (!user) {
      return res.status(404).json({
        error: 'Not found',
        message: 'User not found'
      });
    }

    logger.info(`User deactivated: ${user.email}`);
    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    logger.error('Delete user error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to delete user'
    });
  }
});

export default router;
