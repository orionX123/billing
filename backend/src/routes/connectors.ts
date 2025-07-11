
import express from 'express';
import Joi from 'joi';
import { getDatabase } from '../database/connection';
import { authenticate, requireAdmin } from '../middleware/auth';
import { tenantIsolation } from '../middleware/tenantIsolation';
import { apiRateLimiter } from '../middleware/rateLimiter';
import { logger } from '../utils/logger';
import { connectorService } from '../services/connectorService';

const router = express.Router();

// Apply middleware
router.use(authenticate);
router.use(tenantIsolation);
router.use(apiRateLimiter);

// Validation schemas
const createConnectorSchema = Joi.object({
  connector_type_id: Joi.string().uuid().required(),
  name: Joi.string().min(1).max(255).required(),
  description: Joi.string().optional().allow(''),
  config: Joi.object().required(),
  sync_settings: Joi.object().optional()
});

const updateConnectorSchema = Joi.object({
  name: Joi.string().min(1).max(255).optional(),
  description: Joi.string().optional().allow(''),
  config: Joi.object().optional(),
  sync_settings: Joi.object().optional(),
  status: Joi.string().valid('active', 'inactive').optional()
});

// Get all connector types
router.get('/types', async (req, res) => {
  try {
    const db = getDatabase();
    const connectorTypes = await db('connector_types')
      .where('is_active', true)
      .orderBy('category')
      .orderBy('display_name');

    res.json(connectorTypes);
  } catch (error) {
    logger.error('Get connector types error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to fetch connector types'
    });
  }
});

// Get tenant connectors
router.get('/', async (req, res) => {
  try {
    const { category, status } = req.query;
    const db = getDatabase();
    
    let query = db('tenant_connectors')
      .leftJoin('connector_types', 'tenant_connectors.connector_type_id', 'connector_types.id')
      .leftJoin('users as created_user', 'tenant_connectors.created_by', 'created_user.id')
      .select(
        'tenant_connectors.*',
        'connector_types.name as type_name',
        'connector_types.display_name as type_display_name',
        'connector_types.category',
        'connector_types.icon_url',
        'created_user.full_name as created_by_name'
      )
      .where('tenant_connectors.tenant_id', req.tenantId);

    if (category) {
      query = query.where('connector_types.category', category);
    }

    if (status) {
      query = query.where('tenant_connectors.status', status);
    }

    const connectors = await query.orderBy('tenant_connectors.created_at', 'desc');

    // Remove sensitive data from config
    const sanitizedConnectors = connectors.map(connector => ({
      ...connector,
      config: Object.keys(connector.config || {}).reduce((acc, key) => {
        acc[key] = key.toLowerCase().includes('secret') || key.toLowerCase().includes('key') 
          ? '***masked***' 
          : connector.config[key];
        return acc;
      }, {} as any)
    }));

    res.json(sanitizedConnectors);
  } catch (error) {
    logger.error('Get connectors error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to fetch connectors'
    });
  }
});

// Get connector by ID
router.get('/:id', async (req, res) => {
  try {
    const db = getDatabase();
    const connector = await db('tenant_connectors')
      .leftJoin('connector_types', 'tenant_connectors.connector_type_id', 'connector_types.id')
      .select(
        'tenant_connectors.*',
        'connector_types.name as type_name',
        'connector_types.display_name as type_display_name',
        'connector_types.category',
        'connector_types.config_schema',
        'connector_types.supports_oauth',
        'connector_types.supports_webhook'
      )
      .where({
        'tenant_connectors.id': req.params.id,
        'tenant_connectors.tenant_id': req.tenantId
      })
      .first();

    if (!connector) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Connector not found'
      });
    }

    res.json(connector);
  } catch (error) {
    logger.error('Get connector error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to fetch connector'
    });
  }
});

// Create connector
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { error } = createConnectorSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.details[0].message
      });
    }

    const { connector_type_id, name, description, config, sync_settings } = req.body;
    const db = getDatabase();

    // Verify connector type exists
    const connectorType = await db('connector_types')
      .where({ id: connector_type_id, is_active: true })
      .first();

    if (!connectorType) {
      return res.status(400).json({
        error: 'Invalid connector type',
        message: 'Connector type not found or inactive'
      });
    }

    // Create connector
    const [connector] = await db('tenant_connectors')
      .insert({
        tenant_id: req.tenantId,
        connector_type_id,
        name,
        description: description || null,
        config: JSON.stringify(config),
        sync_settings: sync_settings ? JSON.stringify(sync_settings) : null,
        created_by: req.user?.userId,
        updated_by: req.user?.userId,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning('*');

    // Test connection
    try {
      await connectorService.testConnection(connector.id);
      await db('tenant_connectors')
        .where('id', connector.id)
        .update({ status: 'active' });
    } catch (testError) {
      logger.warn(`Connection test failed for connector ${connector.id}:`, testError);
      await db('tenant_connectors')
        .where('id', connector.id)
        .update({ 
          status: 'error',
          last_error: testError instanceof Error ? testError.message : 'Connection test failed'
        });
    }

    logger.info(`Connector created: ${name} (${connectorType.display_name})`);
    res.status(201).json(connector);
  } catch (error) {
    logger.error('Create connector error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to create connector'
    });
  }
});

// Update connector
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { error } = updateConnectorSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.details[0].message
      });
    }

    const db = getDatabase();
    const updates: any = {
      ...req.body,
      updated_by: req.user?.userId,
      updated_at: new Date()
    };

    if (req.body.config) {
      updates.config = JSON.stringify(req.body.config);
    }

    if (req.body.sync_settings) {
      updates.sync_settings = JSON.stringify(req.body.sync_settings);
    }

    const [connector] = await db('tenant_connectors')
      .where({
        id: req.params.id,
        tenant_id: req.tenantId
      })
      .update(updates)
      .returning('*');

    if (!connector) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Connector not found'
      });
    }

    logger.info(`Connector updated: ${connector.name}`);
    res.json(connector);
  } catch (error) {
    logger.error('Update connector error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to update connector'
    });
  }
});

// Test connector connection
router.post('/:id/test', requireAdmin, async (req, res) => {
  try {
    const result = await connectorService.testConnection(req.params.id);
    res.json(result);
  } catch (error) {
    logger.error('Test connection error:', error);
    res.status(500).json({
      error: 'Connection test failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Sync connector data
router.post('/:id/sync', requireAdmin, async (req, res) => {
  try {
    const { direction = 'inbound', entity_types } = req.body;
    
    const syncId = await connectorService.startSync(req.params.id, {
      direction,
      entity_types,
      triggered_by: req.user?.userId
    });

    res.json({ 
      message: 'Sync started', 
      sync_id: syncId 
    });
  } catch (error) {
    logger.error('Sync connector error:', error);
    res.status(500).json({
      error: 'Sync failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get sync logs
router.get('/:id/logs', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const db = getDatabase();
    const logs = await db('connector_sync_logs')
      .where('tenant_connector_id', req.params.id)
      .orderBy('started_at', 'desc')
      .limit(Number(limit))
      .offset(offset);

    const total = await db('connector_sync_logs')
      .where('tenant_connector_id', req.params.id)
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
    logger.error('Get sync logs error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to fetch sync logs'
    });
  }
});

// Delete connector
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const db = getDatabase();
    const deleted = await db('tenant_connectors')
      .where({
        id: req.params.id,
        tenant_id: req.tenantId
      })
      .del();

    if (!deleted) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Connector not found'
      });
    }

    logger.info(`Connector deleted: ${req.params.id}`);
    res.json({ message: 'Connector deleted successfully' });
  } catch (error) {
    logger.error('Delete connector error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to delete connector'
    });
  }
});

export default router;
