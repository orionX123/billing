
import express from 'express';
import { getDatabase } from '../database/connection';
import { logger } from '../utils/logger';
import crypto from 'crypto';

const router = express.Router();

// Webhook endpoint for connectors
router.post('/connector/:connectorId', async (req, res) => {
  try {
    const { connectorId } = req.params;
    const db = getDatabase();

    // Get connector and webhook configuration
    const connector = await db('tenant_connectors')
      .leftJoin('connector_types', 'tenant_connectors.connector_type_id', 'connector_types.id')
      .leftJoin('connector_webhooks', 'tenant_connectors.id', 'connector_webhooks.tenant_connector_id')
      .select(
        'tenant_connectors.*',
        'connector_types.name as type_name',
        'connector_webhooks.secret_key',
        'connector_webhooks.events'
      )
      .where('tenant_connectors.id', connectorId)
      .first();

    if (!connector) {
      return res.status(404).json({ error: 'Connector not found' });
    }

    // Verify webhook signature if secret is configured
    if (connector.secret_key) {
      const signature = req.headers['x-webhook-signature'] || req.headers['stripe-signature'];
      if (!this.verifyWebhookSignature(req.body, signature as string, connector.secret_key)) {
        return res.status(401).json({ error: 'Invalid webhook signature' });
      }
    }

    // Process webhook based on connector type
    await this.processWebhook(connector, req.body, req.headers);

    // Update webhook stats
    await db('connector_webhooks')
      .where('tenant_connector_id', connectorId)
      .increment('total_received', 1)
      .update('last_received', new Date());

    logger.info(`Webhook processed for connector ${connectorId} (${connector.type_name})`);
    res.status(200).json({ message: 'Webhook processed successfully' });
  } catch (error) {
    logger.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Verify webhook signature
router.verifyWebhookSignature = function(payload: any, signature: string, secret: string): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    logger.error('Signature verification error:', error);
    return false;
  }
};

// Process webhook based on connector type
router.processWebhook = async function(connector: any, payload: any, headers: any): Promise<void> {
  const db = getDatabase();

  switch (connector.type_name) {
    case 'shopify':
      await this.processShopifyWebhook(connector, payload, headers);
      break;
    case 'stripe':
      await this.processStripeWebhook(connector, payload, headers);
      break;
    case 'woocommerce':
      await this.processWooCommerceWebhook(connector, payload, headers);
      break;
    default:
      logger.warn(`No webhook processor for connector type: ${connector.type_name}`);
  }
};

// Shopify webhook processor
router.processShopifyWebhook = async function(connector: any, payload: any, headers: any): Promise<void> {
  const db = getDatabase();
  const topic = headers['x-shopify-topic'];

  switch (topic) {
    case 'products/create':
    case 'products/update':
      await this.syncShopifyProduct(connector, payload);
      break;
    case 'orders/create':
    case 'orders/updated':
      await this.syncShopifyOrder(connector, payload);
      break;
  }
};

router.syncShopifyProduct = async function(connector: any, product: any): Promise<void> {
  const db = getDatabase();
  
  try {
    const existingProduct = await db('products')
      .where({ external_id: product.id.toString(), tenant_id: connector.tenant_id })
      .first();

    const productData = {
      name: product.title,
      description: product.body_html,
      price: parseFloat(product.variants[0]?.price || '0'),
      stock: product.variants[0]?.inventory_quantity || 0,
      sku: product.variants[0]?.sku || '',
      external_id: product.id.toString(),
      external_source: 'shopify',
      tenant_id: connector.tenant_id,
      updated_at: new Date()
    };

    if (existingProduct) {
      await db('products')
        .where('id', existingProduct.id)
        .update(productData);
    } else {
      await db('products')
        .insert({
          ...productData,
          created_at: new Date(),
          is_active: true
        });
    }

    logger.info(`Shopify product synced: ${product.title}`);
  } catch (error) {
    logger.error(`Failed to sync Shopify product ${product.id}:`, error);
  }
};

// Stripe webhook processor
router.processStripeWebhook = async function(connector: any, payload: any, headers: any): Promise<void> {
  const eventType = payload.type;

  switch (eventType) {
    case 'payment_intent.succeeded':
      await this.handleStripePayment(connector, payload.data.object);
      break;
    case 'customer.created':
      await this.syncStripeCustomer(connector, payload.data.object);
      break;
  }
};

export default router;
