
import express from 'express';
import Joi from 'joi';
import { getDatabase } from '../database/connection';
import { authenticate, requireAdmin } from '../middleware/auth';
import { tenantIsolation } from '../middleware/tenantIsolation';
import { apiRateLimiter } from '../middleware/rateLimiter';
import { logger } from '../utils/logger';

const router = express.Router();

// Apply middleware
router.use(authenticate);
router.use(tenantIsolation);
router.use(apiRateLimiter);

// Validation schemas
const generalSettingsSchema = Joi.object({
  companyName: Joi.string().min(2).max(255).required(),
  companyAddress: Joi.string().max(1000).required(),
  panNumber: Joi.string().max(20).required(),
  phone: Joi.string().max(20).required(),
  email: Joi.string().email().required(),
  currency: Joi.string().valid('NPR', 'USD', 'EUR').default('NPR'),
  timezone: Joi.string().default('Asia/Kathmandu'),
  language: Joi.string().default('en'),
  dateFormat: Joi.string().default('YYYY-MM-DD')
});

const taxSettingsSchema = Joi.object({
  defaultVatRate: Joi.number().min(0).max(100).default(13),
  enableTax: Joi.boolean().default(true),
  taxNumber: Joi.string().max(50).optional()
});

const posSettingsSchema = Joi.object({
  enableBarcodeScanner: Joi.boolean().default(true),
  printReceiptAutomatically: Joi.boolean().default(false),
  showStockInPOS: Joi.boolean().default(true),
  allowNegativeStock: Joi.boolean().default(false)
});

const notificationSettingsSchema = Joi.object({
  lowStockAlert: Joi.boolean().default(true),
  emailNotifications: Joi.boolean().default(true),
  smsNotifications: Joi.boolean().default(false)
});

const appearanceSettingsSchema = Joi.object({
  theme: Joi.string().valid('light', 'dark', 'auto').default('light'),
  primaryColor: Joi.string().valid('blue', 'green', 'purple', 'red').default('blue'),
  showLogo: Joi.boolean().default(true)
});

const securitySettingsSchema = Joi.object({
  enforceStrongPasswords: Joi.boolean().default(true),
  sessionTimeout: Joi.number().min(5).max(480).default(30),
  twoFactorAuth: Joi.boolean().default(false)
});

// Get all settings for tenant
router.get('/', async (req, res) => {
  try {
    const db = getDatabase();
    const settings = await db('tenant_settings')
      .where('tenant_id', req.tenantId)
      .first();

    if (!settings) {
      // Return default settings if none exist
      return res.json({
        general: {
          companyName: "Your Company Name",
          companyAddress: "Your Company Address",
          panNumber: "",
          phone: "",
          email: "",
          currency: "NPR",
          timezone: "Asia/Kathmandu",
          language: "en",
          dateFormat: "YYYY-MM-DD"
        },
        tax: {
          defaultVatRate: 13,
          enableTax: true,
          taxNumber: ""
        },
        pos: {
          enableBarcodeScanner: true,
          printReceiptAutomatically: false,
          showStockInPOS: true,
          allowNegativeStock: false
        },
        notifications: {
          lowStockAlert: true,
          emailNotifications: true,
          smsNotifications: false
        },
        appearance: {
          theme: "light",
          primaryColor: "blue",
          showLogo: true
        },
        security: {
          enforceStrongPasswords: true,
          sessionTimeout: 30,
          twoFactorAuth: false
        }
      });
    }

    res.json(settings.settings);
  } catch (error) {
    logger.error('Get settings error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to fetch settings'
    });
  }
});

// Update settings section
router.put('/:section', requireAdmin, async (req, res) => {
  try {
    const { section } = req.params;
    let schema;

    switch (section) {
      case 'general':
        schema = generalSettingsSchema;
        break;
      case 'tax':
        schema = taxSettingsSchema;
        break;
      case 'pos':
        schema = posSettingsSchema;
        break;
      case 'notifications':
        schema = notificationSettingsSchema;
        break;
      case 'appearance':
        schema = appearanceSettingsSchema;
        break;
      case 'security':
        schema = securitySettingsSchema;
        break;
      default:
        return res.status(400).json({
          error: 'Invalid section',
          message: 'Settings section not found'
        });
    }

    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.details[0].message
      });
    }

    const db = getDatabase();
    
    // Get existing settings or create default structure
    let existingSettings = await db('tenant_settings')
      .where('tenant_id', req.tenantId)
      .first();

    let settings = existingSettings?.settings || {};
    settings[section] = req.body;

    if (existingSettings) {
      // Update existing settings
      await db('tenant_settings')
        .where('tenant_id', req.tenantId)
        .update({
          settings: JSON.stringify(settings),
          updated_by: req.user?.userId,
          updated_at: new Date()
        });
    } else {
      // Create new settings record
      await db('tenant_settings')
        .insert({
          tenant_id: req.tenantId,
          settings: JSON.stringify(settings),
          created_by: req.user?.userId,
          updated_by: req.user?.userId,
          created_at: new Date(),
          updated_at: new Date()
        });
    }

    logger.info(`Settings updated for section: ${section}`);
    res.json({ message: `${section} settings updated successfully`, settings: settings[section] });
  } catch (error) {
    logger.error('Update settings error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to update settings'
    });
  }
});

export default router;
