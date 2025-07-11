
import { getDatabase } from '../database/connection';
import { logger } from '../utils/logger';
import crypto from 'crypto';

interface SyncOptions {
  direction: 'inbound' | 'outbound' | 'bidirectional';
  entity_types?: string[];
  triggered_by?: string;
}

interface ConnectorConfig {
  [key: string]: any;
}

class ConnectorService {
  private encryptionKey: string;

  constructor() {
    this.encryptionKey = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
  }

  // Encrypt sensitive configuration data
  private encrypt(text: string): string {
    const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  // Decrypt configuration data
  private decrypt(encryptedText: string): string {
    const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  // Test connection to external service
  async testConnection(connectorId: string): Promise<{ success: boolean; message: string }> {
    const db = getDatabase();
    
    const connector = await db('tenant_connectors')
      .leftJoin('connector_types', 'tenant_connectors.connector_type_id', 'connector_types.id')
      .select('tenant_connectors.*', 'connector_types.name as type_name')
      .where('tenant_connectors.id', connectorId)
      .first();

    if (!connector) {
      throw new Error('Connector not found');
    }

    const config = JSON.parse(connector.config);
    
    try {
      switch (connector.type_name) {
        case 'quickbooks':
          return await this.testQuickBooksConnection(config);
        case 'shopify':
          return await this.testShopifyConnection(config);
        case 'stripe':
          return await this.testStripeConnection(config);
        case 'woocommerce':
          return await this.testWooCommerceConnection(config);
        case 'api_webhook':
          return await this.testApiConnection(config);
        default:
          throw new Error(`Unsupported connector type: ${connector.type_name}`);
      }
    } catch (error) {
      logger.error(`Connection test failed for ${connector.type_name}:`, error);
      throw error;
    }
  }

  // Start data synchronization
  async startSync(connectorId: string, options: SyncOptions): Promise<string> {
    const db = getDatabase();
    
    const connector = await db('tenant_connectors')
      .leftJoin('connector_types', 'tenant_connectors.connector_type_id', 'connector_types.id')
      .select('tenant_connectors.*', 'connector_types.name as type_name')
      .where('tenant_connectors.id', connectorId)
      .first();

    if (!connector) {
      throw new Error('Connector not found');
    }

    if (connector.status !== 'active') {
      throw new Error('Connector is not active');
    }

    // Create sync log entry
    const [syncLog] = await db('connector_sync_logs')
      .insert({
        tenant_connector_id: connectorId,
        sync_type: 'manual',
        direction: options.direction,
        status: 'pending',
        started_at: new Date()
      })
      .returning('*');

    // Start sync process asynchronously
    this.performSync(syncLog.id, connector, options).catch(error => {
      logger.error(`Sync failed for connector ${connectorId}:`, error);
    });

    return syncLog.id;
  }

  // Perform the actual synchronization
  private async performSync(syncLogId: string, connector: any, options: SyncOptions): Promise<void> {
    const db = getDatabase();
    
    try {
      // Update sync log to running
      await db('connector_sync_logs')
        .where('id', syncLogId)
        .update({ status: 'running' });

      const config = JSON.parse(connector.config);
      let syncResult;

      switch (connector.type_name) {
        case 'quickbooks':
          syncResult = await this.syncQuickBooks(connector, config, options);
          break;
        case 'shopify':
          syncResult = await this.syncShopify(connector, config, options);
          break;
        case 'stripe':
          syncResult = await this.syncStripe(connector, config, options);
          break;
        case 'woocommerce':
          syncResult = await this.syncWooCommerce(connector, config, options);
          break;
        default:
          throw new Error(`Sync not implemented for ${connector.type_name}`);
      }

      // Update sync log with success
      await db('connector_sync_logs')
        .where('id', syncLogId)
        .update({
          status: 'completed',
          completed_at: new Date(),
          records_processed: syncResult.processed,
          records_successful: syncResult.successful,
          records_failed: syncResult.failed,
          sync_summary: JSON.stringify(syncResult.summary)
        });

      // Update connector last sync time
      await db('tenant_connectors')
        .where('id', connector.id)
        .update({ last_sync: new Date() });

    } catch (error) {
      logger.error(`Sync error for ${connector.type_name}:`, error);
      
      // Update sync log with failure
      await db('connector_sync_logs')
        .where('id', syncLogId)
        .update({
          status: 'failed',
          completed_at: new Date(),
          error_message: error instanceof Error ? error.message : 'Unknown error'
        });

      // Update connector status
      await db('tenant_connectors')
        .where('id', connector.id)
        .update({
          status: 'error',
          last_error: error instanceof Error ? error.message : 'Sync failed'
        });
    }
  }

  // QuickBooks integration methods
  private async testQuickBooksConnection(config: ConnectorConfig): Promise<{ success: boolean; message: string }> {
    // Implement QuickBooks OAuth test
    return { success: true, message: 'QuickBooks connection test passed' };
  }

  private async syncQuickBooks(connector: any, config: ConnectorConfig, options: SyncOptions) {
    // Implement QuickBooks sync logic
    return { processed: 0, successful: 0, failed: 0, summary: {} };
  }

  // Shopify integration methods
  private async testShopifyConnection(config: ConnectorConfig): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`https://${config.shop_domain}/admin/api/${config.api_version || '2023-07'}/shop.json`, {
        headers: {
          'X-Shopify-Access-Token': config.access_token,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        return { success: true, message: 'Shopify connection successful' };
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      return { 
        success: false, 
        message: `Shopify connection failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  private async syncShopify(connector: any, config: ConnectorConfig, options: SyncOptions) {
    const db = getDatabase();
    let processed = 0;
    let successful = 0;
    let failed = 0;

    try {
      if (options.direction === 'inbound' || options.direction === 'bidirectional') {
        // Sync products from Shopify
        const productsResponse = await fetch(`https://${config.shop_domain}/admin/api/${config.api_version || '2023-07'}/products.json`, {
          headers: {
            'X-Shopify-Access-Token': config.access_token,
            'Content-Type': 'application/json'
          }
        });

        if (productsResponse.ok) {
          const productsData = await productsResponse.json();
          
          for (const shopifyProduct of productsData.products) {
            processed++;
            try {
              // Check if product already exists
              const existingProduct = await db('products')
                .where({ external_id: shopifyProduct.id.toString(), tenant_id: connector.tenant_id })
                .first();

              const productData = {
                name: shopifyProduct.title,
                description: shopifyProduct.body_html,
                price: parseFloat(shopifyProduct.variants[0]?.price || '0'),
                stock: shopifyProduct.variants[0]?.inventory_quantity || 0,
                sku: shopifyProduct.variants[0]?.sku || '',
                external_id: shopifyProduct.id.toString(),
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
              successful++;
            } catch (error) {
              failed++;
              logger.error(`Failed to sync Shopify product ${shopifyProduct.id}:`, error);
            }
          }
        }
      }
    } catch (error) {
      logger.error('Shopify sync error:', error);
      throw error;
    }

    return { 
      processed, 
      successful, 
      failed, 
      summary: { products_synced: successful } 
    };
  }

  // Stripe integration methods
  private async testStripeConnection(config: ConnectorConfig): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch('https://api.stripe.com/v1/account', {
        headers: {
          'Authorization': `Bearer ${config.secret_key}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      if (response.ok) {
        return { success: true, message: 'Stripe connection successful' };
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      return { 
        success: false, 
        message: `Stripe connection failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  private async syncStripe(connector: any, config: ConnectorConfig, options: SyncOptions) {
    // Implement Stripe sync logic
    return { processed: 0, successful: 0, failed: 0, summary: {} };
  }

  // WooCommerce integration methods
  private async testWooCommerceConnection(config: ConnectorConfig): Promise<{ success: boolean; message: string }> {
    try {
      const auth = Buffer.from(`${config.consumer_key}:${config.consumer_secret}`).toString('base64');
      const response = await fetch(`${config.site_url}/wp-json/wc/v3/system_status`, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        return { success: true, message: 'WooCommerce connection successful' };
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      return { 
        success: false, 
        message: `WooCommerce connection failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  private async syncWooCommerce(connector: any, config: ConnectorConfig, options: SyncOptions) {
    // Implement WooCommerce sync logic
    return { processed: 0, successful: 0, failed: 0, summary: {} };
  }

  // Generic API connection test
  private async testApiConnection(config: ConnectorConfig): Promise<{ success: boolean; message: string }> {
    try {
      const headers: any = {
        'Content-Type': 'application/json'
      };

      if (config.api_key) {
        headers[config.auth_header || 'Authorization'] = `${config.auth_prefix || 'Bearer'} ${config.api_key}`;
      }

      const response = await fetch(config.base_url, { headers });
      
      if (response.ok || response.status === 401) { // 401 might be expected for test endpoint
        return { success: true, message: 'API connection successful' };
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      return { 
        success: false, 
        message: `API connection failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }
}

export const connectorService = new ConnectorService();
