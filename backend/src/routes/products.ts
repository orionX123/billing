
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
const productSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  description: Joi.string().max(1000).optional().allow(''),
  sku: Joi.string().max(100).optional().allow(''),
  barcode: Joi.string().max(100).optional().allow(''),
  category: Joi.string().max(100).required(),
  brand: Joi.string().max(100).optional().allow(''),
  supplier: Joi.string().max(255).optional().allow(''),
  price: Joi.number().min(0).required(),
  costPrice: Joi.number().min(0).default(0),
  unit: Joi.string().max(20).default('pcs'),
  stock: Joi.number().min(0).default(0),
  reorderPoint: Joi.number().min(0).default(0),
  vatRate: Joi.number().min(0).max(100).default(13),
  hsnCode: Joi.string().max(20).optional().allow(''),
  isActive: Joi.boolean().default(true),
});

// Get all products
router.get('/', async (req, res) => {
  try {
    const db = getDatabase();
    const { page = 1, limit = 50, search = '', category = '', status = 'all' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = db('products')
      .where('tenant_id', req.tenantId);

    if (search) {
      query = query.where(builder => {
        builder
          .where('name', 'ilike', `%${search}%`)
          .orWhere('sku', 'ilike', `%${search}%`)
          .orWhere('barcode', 'ilike', `%${search}%`);
      });
    }

    if (category) {
      query = query.where('category', category);
    }

    if (status !== 'all') {
      query = query.where('is_active', status === 'active');
    }

    const products = await query
      .orderBy('created_at', 'desc')
      .limit(Number(limit))
      .offset(offset);

    const total = await db('products')
      .where('tenant_id', req.tenantId)
      .count('* as count')
      .first();

    res.json({
      products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: Number(total?.count || 0),
        pages: Math.ceil(Number(total?.count || 0) / Number(limit))
      }
    });
  } catch (error) {
    logger.error('Get products error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to fetch products'
    });
  }
});

// Get product categories
router.get('/categories', async (req, res) => {
  try {
    const db = getDatabase();
    const categories = await db('products')
      .where('tenant_id', req.tenantId)
      .where('is_active', true)
      .distinct('category')
      .whereNotNull('category')
      .pluck('category');

    res.json(categories);
  } catch (error) {
    logger.error('Get categories error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to fetch categories'
    });
  }
});

// Get low stock products
router.get('/low-stock', async (req, res) => {
  try {
    const db = getDatabase();
    const products = await db('products')
      .where('tenant_id', req.tenantId)
      .where('is_active', true)
      .whereRaw('stock <= reorder_point')
      .orderBy('stock', 'asc');

    res.json(products);
  } catch (error) {
    logger.error('Get low stock products error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to fetch low stock products'
    });
  }
});

// Get product by ID
router.get('/:id', async (req, res) => {
  try {
    const db = getDatabase();
    const product = await db('products')
      .where({ id: req.params.id, tenant_id: req.tenantId })
      .first();

    if (!product) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Product not found'
      });
    }

    res.json(product);
  } catch (error) {
    logger.error('Get product error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to fetch product'
    });
  }
});

// Create product
router.post('/', async (req, res) => {
  try {
    const { error } = productSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.details[0].message
      });
    }

    const db = getDatabase();
    
    // Check for duplicate SKU/Barcode within tenant
    if (req.body.sku) {
      const existingSku = await db('products')
        .where({ sku: req.body.sku, tenant_id: req.tenantId, is_active: true })
        .first();
      
      if (existingSku) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'Product with this SKU already exists'
        });
      }
    }

    const [product] = await db('products')
      .insert({
        ...req.body,
        tenant_id: req.tenantId,
        created_by: req.user?.userId,
        updated_by: req.user?.userId,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning('*');

    logger.info(`Product created: ${product.name}`);
    res.status(201).json(product);
  } catch (error) {
    logger.error('Create product error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to create product'
    });
  }
});

// Update product
router.put('/:id', async (req, res) => {
  try {
    const { error } = productSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.details[0].message
      });
    }

    const db = getDatabase();
    const [product] = await db('products')
      .where({ id: req.params.id, tenant_id: req.tenantId })
      .update({
        ...req.body,
        updated_by: req.user?.userId,
        updated_at: new Date()
      })
      .returning('*');

    if (!product) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Product not found'
      });
    }

    logger.info(`Product updated: ${product.name}`);
    res.json(product);
  } catch (error) {
    logger.error('Update product error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to update product'
    });
  }
});

// Update stock
router.patch('/:id/stock', async (req, res) => {
  try {
    const { quantity, operation = 'set', reason = '' } = req.body;
    
    if (typeof quantity !== 'number' || quantity < 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Quantity must be a positive number'
      });
    }

    const db = getDatabase();
    
    await db.transaction(async (trx) => {
      const product = await trx('products')
        .where({ id: req.params.id, tenant_id: req.tenantId })
        .forUpdate()
        .first();

      if (!product) {
        throw new Error('Product not found');
      }

      let newStock;
      switch (operation) {
        case 'add':
          newStock = product.stock + quantity;
          break;
        case 'subtract':
          newStock = Math.max(0, product.stock - quantity);
          break;
        case 'set':
        default:
          newStock = quantity;
          break;
      }

      await trx('products')
        .where({ id: req.params.id, tenant_id: req.tenantId })
        .update({
          stock: newStock,
          updated_by: req.user?.userId,
          updated_at: new Date()
        });

      // Log stock movement
      await trx('stock_movements').insert({
        product_id: req.params.id,
        tenant_id: req.tenantId,
        movement_type: operation,
        quantity: operation === 'subtract' ? -quantity : quantity,
        previous_stock: product.stock,
        new_stock: newStock,
        reason,
        created_by: req.user?.userId,
        created_at: new Date()
      });
    });

    const updatedProduct = await db('products')
      .where({ id: req.params.id, tenant_id: req.tenantId })
      .first();

    logger.info(`Stock updated for product: ${updatedProduct.name}`);
    res.json(updatedProduct);
  } catch (error) {
    logger.error('Update stock error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to update stock'
    });
  }
});

// Delete product
router.delete('/:id', async (req, res) => {
  try {
    const db = getDatabase();
    const [product] = await db('products')
      .where({ id: req.params.id, tenant_id: req.tenantId })
      .update({
        is_active: false,
        updated_by: req.user?.userId,
        updated_at: new Date()
      })
      .returning('*');

    if (!product) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Product not found'
      });
    }

    logger.info(`Product deleted: ${product.name}`);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    logger.error('Delete product error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to delete product'
    });
  }
});

export default router;
