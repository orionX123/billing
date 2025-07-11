
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Joi from 'joi';
import { getDatabase } from '../database/connection';
import { authRateLimiter } from '../middleware/rateLimiter';
import { logger } from '../utils/logger';

const router = express.Router();

// Validation schemas
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  fullName: Joi.string().min(2).required(),
  role: Joi.string().valid('staff', 'manager', 'admin').default('staff'),
  tenantId: Joi.string().uuid().required(),
});

// Login
router.post('/login', authRateLimiter, async (req, res) => {
  try {
    const { error } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.details[0].message,
      });
    }

    const { email, password } = req.body;
    const db = getDatabase();

    // Find user with tenant info
    const user = await db('users')
      .leftJoin('tenants', 'users.tenant_id', 'tenants.id')
      .select(
        'users.*',
        'tenants.name as tenant_name',
        'tenants.status as tenant_status'
      )
      .where('users.email', email)
      .where('users.is_active', true)
      .first();

    if (!user || !await bcrypt.compare(password, user.password_hash)) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid email or password',
      });
    }

    // Check if tenant is active (for non-superadmin users)
    if (user.role !== 'superadmin' && user.tenant_status !== 'active') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Tenant account is not active',
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        tenantId: user.tenant_id,
        role: user.role,
        email: user.email,
      },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Update last login
    await db('users')
      .where('id', user.id)
      .update({ last_login: new Date() });

    logger.info(`User logged in: ${user.email}`);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        tenantId: user.tenant_id,
        tenantName: user.tenant_name,
      },
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Login failed',
    });
  }
});

// Register (for tenant users)
router.post('/register', async (req, res) => {
  try {
    const { error } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.details[0].message,
      });
    }

    const { email, password, fullName, role, tenantId } = req.body;
    const db = getDatabase();

    // Check if user already exists
    const existingUser = await db('users').where('email', email).first();
    if (existingUser) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'User with this email already exists',
      });
    }

    // Verify tenant exists and is active
    const tenant = await db('tenants')
      .where({ id: tenantId, status: 'active' })
      .first();

    if (!tenant) {
      return res.status(400).json({
        error: 'Invalid tenant',
        message: 'Tenant not found or inactive',
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const [newUser] = await db('users')
      .insert({
        email,
        password_hash: passwordHash,
        full_name: fullName,
        role,
        tenant_id: tenantId,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning(['id', 'email', 'full_name', 'role', 'tenant_id']);

    logger.info(`New user registered: ${email}`);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.full_name,
        role: newUser.role,
        tenantId: newUser.tenant_id,
      },
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Registration failed',
    });
  }
});

export default router;
