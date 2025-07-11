
import express from 'express';
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

// Sales summary report
router.get('/sales-summary', async (req, res) => {
  try {
    const { start_date, end_date, group_by = 'day' } = req.query;
    const db = getDatabase();

    let dateFormat;
    switch (group_by) {
      case 'month':
        dateFormat = 'YYYY-MM';
        break;
      case 'year':
        dateFormat = 'YYYY';
        break;
      default:
        dateFormat = 'YYYY-MM-DD';
    }

    let query = db('invoices')
      .select([
        db.raw(`TO_CHAR(invoice_date, '${dateFormat}') as period`),
        db.raw('COUNT(*) as invoice_count'),
        db.raw('SUM(total_amount) as total_sales'),
        db.raw('SUM(vat_amount) as total_vat'),
        db.raw('AVG(total_amount) as average_sale')
      ])
      .where('tenant_id', req.tenantId)
      .where('is_active', true)
      .groupBy(db.raw(`TO_CHAR(invoice_date, '${dateFormat}')`))
      .orderBy('period', 'desc');

    if (start_date) {
      query = query.where('invoice_date', '>=', start_date);
    }

    if (end_date) {
      query = query.where('invoice_date', '<=', end_date);
    }

    const results = await query;

    res.json({
      summary: results,
      totals: {
        total_invoices: results.reduce((sum, r) => sum + parseInt(r.invoice_count), 0),
        total_sales: results.reduce((sum, r) => sum + parseFloat(r.total_sales || 0), 0),
        total_vat: results.reduce((sum, r) => sum + parseFloat(r.total_vat || 0), 0),
      }
    });
  } catch (error) {
    logger.error('Sales summary error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to generate sales summary'
    });
  }
});

// Product performance report
router.get('/product-performance', async (req, res) => {
  try {
    const { start_date, end_date, limit = 20 } = req.query;
    const db = getDatabase();

    let query = db('invoice_items')
      .join('invoices', 'invoice_items.invoice_id', 'invoices.id')
      .select([
        'invoice_items.product_id',
        'invoice_items.product_name',
        db.raw('SUM(invoice_items.quantity) as total_quantity'),
        db.raw('SUM(invoice_items.total_amount) as total_revenue'),
        db.raw('COUNT(DISTINCT invoice_items.invoice_id) as order_count'),
        db.raw('AVG(invoice_items.unit_price) as avg_price')
      ])
      .where('invoices.tenant_id', req.tenantId)
      .where('invoices.is_active', true)
      .groupBy('invoice_items.product_id', 'invoice_items.product_name')
      .orderBy('total_revenue', 'desc')
      .limit(Number(limit));

    if (start_date) {
      query = query.where('invoices.invoice_date', '>=', start_date);
    }

    if (end_date) {
      query = query.where('invoices.invoice_date', '<=', end_date);
    }

    const results = await query;
    res.json(results);
  } catch (error) {
    logger.error('Product performance error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to generate product performance report'
    });
  }
});

// Customer analysis report
router.get('/customer-analysis', async (req, res) => {
  try {
    const { start_date, end_date, limit = 20 } = req.query;
    const db = getDatabase();

    let query = db('invoices')
      .select([
        'customer_id',
        'customer_name',
        db.raw('COUNT(*) as invoice_count'),
        db.raw('SUM(total_amount) as total_spent'),
        db.raw('AVG(total_amount) as avg_order_value'),
        db.raw('MAX(invoice_date) as last_order_date')
      ])
      .where('tenant_id', req.tenantId)
      .where('is_active', true)
      .groupBy('customer_id', 'customer_name')
      .orderBy('total_spent', 'desc')
      .limit(Number(limit));

    if (start_date) {
      query = query.where('invoice_date', '>=', start_date);
    }

    if (end_date) {
      query = query.where('invoice_date', '<=', end_date);
    }

    const results = await query;
    res.json(results);
  } catch (error) {
    logger.error('Customer analysis error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to generate customer analysis'
    });
  }
});

// Tax report (VAT)
router.get('/tax-summary', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const db = getDatabase();

    let query = db('invoices')
      .select([
        db.raw('SUM(subtotal) as total_subtotal'),
        db.raw('SUM(total_discount) as total_discount'),
        db.raw('SUM(taxable_amount) as total_taxable'),
        db.raw('SUM(vat_amount) as total_vat'),
        db.raw('SUM(total_amount) as total_amount'),
        db.raw('COUNT(*) as invoice_count')
      ])
      .where('tenant_id', req.tenantId)
      .where('is_active', true);

    if (start_date) {
      query = query.where('invoice_date', '>=', start_date);
    }

    if (end_date) {
      query = query.where('invoice_date', '<=', end_date);
    }

    const summary = await query.first();

    // VAT breakdown by rate
    let vatBreakdown = db('invoice_items')
      .join('invoices', 'invoice_items.invoice_id', 'invoices.id')
      .select([
        'invoice_items.vat_rate',
        db.raw('SUM(invoice_items.total_amount) as taxable_amount'),
        db.raw('SUM(invoice_items.total_amount * invoice_items.vat_rate / 100) as vat_amount')
      ])
      .where('invoices.tenant_id', req.tenantId)
      .where('invoices.is_active', true)
      .groupBy('invoice_items.vat_rate')
      .orderBy('invoice_items.vat_rate');

    if (start_date) {
      vatBreakdown = vatBreakdown.where('invoices.invoice_date', '>=', start_date);
    }

    if (end_date) {
      vatBreakdown = vatBreakdown.where('invoices.invoice_date', '<=', end_date);
    }

    const breakdown = await vatBreakdown;

    res.json({
      summary,
      vat_breakdown: breakdown
    });
  } catch (error) {
    logger.error('Tax summary error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to generate tax summary'
    });
  }
});

// Inventory report
router.get('/inventory', async (req, res) => {
  try {
    const { category, low_stock_only = false } = req.query;
    const db = getDatabase();

    let query = db('products')
      .select([
        'id',
        'name',
        'sku',
        'category',
        'stock',
        'reorder_point',
        'cost_price',
        'price',
        db.raw('(price - cost_price) as profit_margin'),
        db.raw('(stock * cost_price) as inventory_value')
      ])
      .where('tenant_id', req.tenantId)
      .where('is_active', true);

    if (category) {
      query = query.where('category', category);
    }

    if (low_stock_only === 'true') {
      query = query.whereRaw('stock <= reorder_point');
    }

    const products = await query.orderBy('name');

    const summary = {
      total_products: products.length,
      total_inventory_value: products.reduce((sum, p) => sum + parseFloat(p.inventory_value || 0), 0),
      low_stock_items: products.filter(p => p.stock <= p.reorder_point).length,
      out_of_stock_items: products.filter(p => p.stock === 0).length
    };

    res.json({
      products,
      summary
    });
  } catch (error) {
    logger.error('Inventory report error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to generate inventory report'
    });
  }
});

export default router;
