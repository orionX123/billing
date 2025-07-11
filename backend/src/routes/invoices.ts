
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
const invoiceItemSchema = Joi.object({
  product_id: Joi.string().uuid().required(),
  product_name: Joi.string().required(),
  hsn_code: Joi.string().optional().allow(''),
  quantity: Joi.number().min(0.01).required(),
  unit: Joi.string().required(),
  unit_price: Joi.number().min(0).required(),
  discount: Joi.number().min(0).default(0),
  vat_rate: Joi.number().min(0).max(100).default(13),
  total_amount: Joi.number().min(0).required()
});

const invoiceSchema = Joi.object({
  customer_id: Joi.string().uuid().required(),
  customer_name: Joi.string().required(),
  customer_email: Joi.string().email().optional().allow(''),
  customer_phone: Joi.string().optional().allow(''),
  customer_address: Joi.string().required(),
  customer_pan: Joi.string().optional().allow(''),
  invoice_date: Joi.date().required(),
  due_date: Joi.date().required(),
  items: Joi.array().items(invoiceItemSchema).min(1).required(),
  subtotal: Joi.number().min(0).required(),
  total_discount: Joi.number().min(0).default(0),
  taxable_amount: Joi.number().min(0).required(),
  vat_amount: Joi.number().min(0).required(),
  total_amount: Joi.number().min(0).required(),
  status: Joi.string().valid('draft', 'sent', 'paid', 'overdue', 'cancelled').default('draft'),
  payment_terms: Joi.string().default('Net 30'),
  payment_method: Joi.string().optional().allow(''),
  remarks: Joi.string().optional().allow('')
});

// Get all invoices
router.get('/', async (req, res) => {
  try {
    const db = getDatabase();
    const { 
      page = 1, 
      limit = 50, 
      search = '', 
      status = 'all',
      customer_id = '',
      date_from = '',
      date_to = ''
    } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = db('invoices')
      .where('tenant_id', req.tenantId)
      .where('is_active', true);

    if (search) {
      query = query.where(builder => {
        builder
          .where('invoice_number', 'ilike', `%${search}%`)
          .orWhere('customer_name', 'ilike', `%${search}%`);
      });
    }

    if (status !== 'all') {
      query = query.where('status', status);
    }

    if (customer_id) {
      query = query.where('customer_id', customer_id);
    }

    if (date_from) {
      query = query.where('invoice_date', '>=', date_from);
    }

    if (date_to) {
      query = query.where('invoice_date', '<=', date_to);
    }

    const invoices = await query
      .orderBy('created_at', 'desc')
      .limit(Number(limit))
      .offset(offset)
      .select(
        'id',
        'invoice_number as invoiceNumber',
        'fiscal_year as fiscalYear',
        'customer_id as customerId',
        'customer_name as customerName',
        'customer_email as customerEmail',
        'customer_phone as customerPhone',
        'customer_address as customerAddress',
        'customer_pan as customerPAN',
        'invoice_date as invoiceDate',
        'due_date as dueDate',
        'subtotal',
        'total_discount as totalDiscount',
        'taxable_amount as taxableAmount',
        'vat_amount as vatAmount',
        'total_amount as totalAmount',
        'status',
        'payment_terms as paymentTerms',
        'payment_method as paymentMethod',
        'remarks',
        'print_count as printCount',
        'synced_with_ird as syncedWithIRD',
        'created_at as createdDate',
        'updated_at as updatedDate',
        'created_by as createdBy',
        'updated_by as updatedBy',
        'is_active as isActive'
      );

    // Get items for each invoice
    for (const invoice of invoices) {
      const items = await db('invoice_items')
        .where('invoice_id', invoice.id)
        .select(
          'id',
          'product_id as productId',
          'product_name as productName',
          'hsn_code as hsnCode',
          'quantity',
          'unit',
          'unit_price as unitPrice',
          'discount',
          'vat_rate as vatRate',
          'total_amount as totalAmount'
        );
      invoice.items = items;
    }

    const total = await db('invoices')
      .where('tenant_id', req.tenantId)
      .where('is_active', true)
      .count('* as count')
      .first();

    res.json({
      invoices,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: Number(total?.count || 0),
        pages: Math.ceil(Number(total?.count || 0) / Number(limit))
      }
    });
  } catch (error) {
    logger.error('Get invoices error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to fetch invoices'
    });
  }
});

// Get invoice by ID with items
router.get('/:id', async (req, res) => {
  try {
    const db = getDatabase();
    const invoice = await db('invoices')
      .where({ id: req.params.id, tenant_id: req.tenantId, is_active: true })
      .select(
        'id',
        'invoice_number as invoiceNumber',
        'fiscal_year as fiscalYear',
        'customer_id as customerId',
        'customer_name as customerName',
        'customer_email as customerEmail',
        'customer_phone as customerPhone',
        'customer_address as customerAddress',
        'customer_pan as customerPAN',
        'invoice_date as invoiceDate',
        'due_date as dueDate',
        'subtotal',
        'total_discount as totalDiscount',
        'taxable_amount as taxableAmount',
        'vat_amount as vatAmount',
        'total_amount as totalAmount',
        'status',
        'payment_terms as paymentTerms',
        'payment_method as paymentMethod',
        'remarks',
        'print_count as printCount',
        'synced_with_ird as syncedWithIRD',
        'created_at as createdDate',
        'updated_at as updatedDate',
        'created_by as createdBy',
        'updated_by as updatedBy',
        'is_active as isActive'
      )
      .first();

    if (!invoice) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Invoice not found'
      });
    }

    const items = await db('invoice_items')
      .where('invoice_id', req.params.id)
      .select(
        'id',
        'product_id as productId',
        'product_name as productName',
        'hsn_code as hsnCode',
        'quantity',
        'unit',
        'unit_price as unitPrice',
        'discount',
        'vat_rate as vatRate',
        'total_amount as totalAmount'
      );

    res.json({
      ...invoice,
      items
    });
  } catch (error) {
    logger.error('Get invoice error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to fetch invoice'
    });
  }
});

// Create invoice
router.post('/', async (req, res) => {
  try {
    const { error } = invoiceSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.details[0].message
      });
    }

    const db = getDatabase();
    
    const result = await db.transaction(async (trx) => {
      // Generate invoice number
      const currentYear = new Date().getFullYear();
      const fiscalYear = `${currentYear}-${String(currentYear + 1).slice(-2)}`;
      
      const lastInvoice = await trx('invoices')
        .where('tenant_id', req.tenantId)
        .where('fiscal_year', fiscalYear)
        .orderBy('invoice_number', 'desc')
        .first();

      let sequence = 1;
      if (lastInvoice) {
        const lastNumber = lastInvoice.invoice_number.split('-').pop();
        sequence = parseInt(lastNumber) + 1;
      }

      const invoiceNumber = `INV-${fiscalYear}-${String(sequence).padStart(4, '0')}`;

      // Create invoice
      const { items, ...invoiceData } = req.body;
      const [invoice] = await trx('invoices')
        .insert({
          ...invoiceData,
          invoice_number: invoiceNumber,
          fiscal_year: fiscalYear,
          tenant_id: req.tenantId,
          print_count: 0,
          synced_with_ird: false,
          created_by: req.user?.userId,
          updated_by: req.user?.userId,
          created_at: new Date(),
          updated_at: new Date(),
          is_active: true
        })
        .returning('*');

      // Create invoice items
      const invoiceItems = items.map((item: any) => ({
        ...item,
        invoice_id: invoice.id,
        created_at: new Date()
      }));

      await trx('invoice_items').insert(invoiceItems);

      // Update product stock
      for (const item of items) {
        await trx('products')
          .where({ id: item.product_id, tenant_id: req.tenantId })
          .decrement('stock', item.quantity);

        // Log stock movement
        await trx('stock_movements').insert({
          product_id: item.product_id,
          tenant_id: req.tenantId,
          movement_type: 'sale',
          quantity: -item.quantity,
          reason: `Invoice ${invoiceNumber}`,
          created_by: req.user?.userId,
          created_at: new Date()
        });
      }

      return invoice;
    });

    logger.info(`Invoice created: ${result.invoice_number}`);
    res.status(201).json(result);
  } catch (error) {
    logger.error('Create invoice error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to create invoice'
    });
  }
});

// Update invoice
router.put('/:id', async (req, res) => {
  try {
    const { error } = invoiceSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.details[0].message
      });
    }

    const db = getDatabase();
    const { items, ...invoiceData } = req.body;

    const result = await db.transaction(async (trx) => {
      // Update invoice
      const [invoice] = await trx('invoices')
        .where({ id: req.params.id, tenant_id: req.tenantId })
        .update({
          ...invoiceData,
          updated_by: req.user?.userId,
          updated_at: new Date()
        })
        .returning('*');

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      // Delete existing items
      await trx('invoice_items')
        .where('invoice_id', req.params.id)
        .del();

      // Insert new items
      const invoiceItems = items.map((item: any) => ({
        ...item,
        invoice_id: invoice.id,
        created_at: new Date()
      }));

      await trx('invoice_items').insert(invoiceItems);

      return invoice;
    });

    logger.info(`Invoice updated: ${result.invoice_number}`);
    res.json(result);
  } catch (error) {
    logger.error('Update invoice error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to update invoice'
    });
  }
});

// Print invoice
router.post('/:id/print', async (req, res) => {
  try {
    const db = getDatabase();
    const [invoice] = await db('invoices')
      .where({ id: req.params.id, tenant_id: req.tenantId })
      .increment('print_count', 1)
      .update({
        updated_by: req.user?.userId,
        updated_at: new Date()
      })
      .returning('*');

    if (!invoice) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Invoice not found'
      });
    }

    logger.info(`Invoice printed: ${invoice.invoice_number}`);
    res.json({ message: 'Invoice printed successfully', printCount: invoice.print_count });
  } catch (error) {
    logger.error('Print invoice error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to print invoice'
    });
  }
});

// Delete invoice
router.delete('/:id', async (req, res) => {
  try {
    const db = getDatabase();
    const [invoice] = await db('invoices')
      .where({ id: req.params.id, tenant_id: req.tenantId })
      .update({
        is_active: false,
        updated_by: req.user?.userId,
        updated_at: new Date()
      })
      .returning('*');

    if (!invoice) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Invoice not found'
      });
    }

    logger.info(`Invoice deleted: ${invoice.invoice_number}`);
    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    logger.error('Delete invoice error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to delete invoice'
    });
  }
});

export default router;
