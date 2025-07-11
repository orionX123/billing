
import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Connector types table
  await knex.schema.createTable('connector_types', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 100).notNullable().unique();
    table.string('display_name', 255).notNullable();
    table.text('description').nullable();
    table.string('category', 50).notNullable(); // 'accounting', 'ecommerce', 'payment', 'erp', 'crm'
    table.string('icon_url', 500).nullable();
    table.json('config_schema').notNullable(); // JSON schema for configuration
    table.json('webhook_events').nullable(); // Supported webhook events
    table.boolean('supports_oauth').defaultTo(false);
    table.boolean('supports_api_key').defaultTo(true);
    table.boolean('supports_webhook').defaultTo(false);
    table.boolean('is_active').defaultTo(true);
    table.string('version', 20).defaultTo('1.0.0');
    table.timestamps(true, true);

    table.index(['category']);
    table.index(['is_active']);
  });

  // Tenant connectors table
  await knex.schema.createTable('tenant_connectors', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('tenant_id').references('id').inTable('tenants').onDelete('CASCADE').notNullable();
    table.uuid('connector_type_id').references('id').inTable('connector_types').onDelete('CASCADE').notNullable();
    table.string('name', 255).notNullable();
    table.text('description').nullable();
    table.json('config').notNullable(); // Encrypted configuration
    table.json('oauth_tokens').nullable(); // Encrypted OAuth tokens
    table.enum('status', ['active', 'inactive', 'error', 'pending']).defaultTo('pending');
    table.timestamp('last_sync').nullable();
    table.text('last_error').nullable();
    table.json('sync_settings').nullable(); // Sync frequency, filters, etc.
    table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
    table.uuid('updated_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamps(true, true);

    table.unique(['tenant_id', 'connector_type_id', 'name']);
    table.index(['tenant_id']);
    table.index(['status']);
    table.index(['last_sync']);
  });

  // Connector sync logs table
  await knex.schema.createTable('connector_sync_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('tenant_connector_id').references('id').inTable('tenant_connectors').onDelete('CASCADE').notNullable();
    table.enum('sync_type', ['manual', 'scheduled', 'webhook', 'realtime']).notNullable();
    table.enum('direction', ['inbound', 'outbound', 'bidirectional']).notNullable();
    table.enum('status', ['pending', 'running', 'completed', 'failed', 'cancelled']).defaultTo('pending');
    table.timestamp('started_at').defaultTo(knex.fn.now());
    table.timestamp('completed_at').nullable();
    table.integer('records_processed').defaultTo(0);
    table.integer('records_successful').defaultTo(0);
    table.integer('records_failed').defaultTo(0);
    table.text('error_message').nullable();
    table.json('sync_summary').nullable();
    table.timestamps(true, true);

    table.index(['tenant_connector_id']);
    table.index(['status']);
    table.index(['started_at']);
  });

  // Connector data mappings table
  await knex.schema.createTable('connector_mappings', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('tenant_connector_id').references('id').inTable('tenant_connectors').onDelete('CASCADE').notNullable();
    table.string('entity_type', 50).notNullable(); // 'customer', 'product', 'invoice', etc.
    table.string('local_field', 100).notNullable();
    table.string('remote_field', 100).notNullable();
    table.enum('mapping_type', ['direct', 'transform', 'calculated']).defaultTo('direct');
    table.text('transform_function').nullable(); // JavaScript function for transformation
    table.boolean('is_required').defaultTo(false);
    table.json('default_value').nullable();
    table.timestamps(true, true);

    table.unique(['tenant_connector_id', 'entity_type', 'local_field']);
    table.index(['tenant_connector_id']);
    table.index(['entity_type']);
  });

  // Webhook endpoints table
  await knex.schema.createTable('connector_webhooks', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('tenant_connector_id').references('id').inTable('tenant_connectors').onDelete('CASCADE').notNullable();
    table.string('endpoint_url', 500).notNullable();
    table.string('secret_key', 255).notNullable();
    table.json('events').notNullable(); // Array of event types
    table.boolean('is_active').defaultTo(true);
    table.timestamp('last_received').nullable();
    table.integer('total_received').defaultTo(0);
    table.timestamps(true, true);

    table.unique(['tenant_connector_id', 'endpoint_url']);
    table.index(['tenant_connector_id']);
    table.index(['is_active']);
  });

  // Insert default connector types
  await knex('connector_types').insert([
    {
      name: 'quickbooks',
      display_name: 'QuickBooks Online',
      description: 'Sync customers, products, and invoices with QuickBooks Online',
      category: 'accounting',
      config_schema: JSON.stringify({
        type: 'object',
        properties: {
          client_id: { type: 'string', title: 'Client ID' },
          client_secret: { type: 'string', title: 'Client Secret' },
          sandbox: { type: 'boolean', title: 'Sandbox Mode', default: false }
        },
        required: ['client_id', 'client_secret']
      }),
      supports_oauth: true,
      supports_webhook: true,
      webhook_events: JSON.stringify(['customer.created', 'customer.updated', 'item.created', 'item.updated'])
    },
    {
      name: 'shopify',
      display_name: 'Shopify',
      description: 'Sync products and orders with Shopify store',
      category: 'ecommerce',
      config_schema: JSON.stringify({
        type: 'object',
        properties: {
          shop_domain: { type: 'string', title: 'Shop Domain' },
          access_token: { type: 'string', title: 'Access Token' },
          api_version: { type: 'string', title: 'API Version', default: '2023-07' }
        },
        required: ['shop_domain', 'access_token']
      }),
      supports_api_key: true,
      supports_webhook: true,
      webhook_events: JSON.stringify(['orders/create', 'orders/updated', 'products/create', 'products/update'])
    },
    {
      name: 'stripe',
      display_name: 'Stripe',
      description: 'Sync payment data and create invoices in Stripe',
      category: 'payment',
      config_schema: JSON.stringify({
        type: 'object',
        properties: {
          secret_key: { type: 'string', title: 'Secret Key' },
          publishable_key: { type: 'string', title: 'Publishable Key' },
          webhook_secret: { type: 'string', title: 'Webhook Secret' }
        },
        required: ['secret_key', 'publishable_key']
      }),
      supports_api_key: true,
      supports_webhook: true,
      webhook_events: JSON.stringify(['payment_intent.succeeded', 'invoice.payment_succeeded', 'customer.created'])
    },
    {
      name: 'woocommerce',
      display_name: 'WooCommerce',
      description: 'Sync products and orders with WooCommerce store',
      category: 'ecommerce',
      config_schema: JSON.stringify({
        type: 'object',
        properties: {
          site_url: { type: 'string', title: 'Site URL' },
          consumer_key: { type: 'string', title: 'Consumer Key' },
          consumer_secret: { type: 'string', title: 'Consumer Secret' }
        },
        required: ['site_url', 'consumer_key', 'consumer_secret']
      }),
      supports_api_key: true,
      supports_webhook: true,
      webhook_events: JSON.stringify(['order.created', 'order.updated', 'product.created', 'product.updated'])
    },
    {
      name: 'api_webhook',
      display_name: 'Generic API/Webhook',
      description: 'Connect to any REST API or receive webhook data',
      category: 'api',
      config_schema: JSON.stringify({
        type: 'object',
        properties: {
          base_url: { type: 'string', title: 'Base URL' },
          api_key: { type: 'string', title: 'API Key' },
          auth_header: { type: 'string', title: 'Auth Header Name', default: 'Authorization' },
          auth_prefix: { type: 'string', title: 'Auth Prefix', default: 'Bearer' }
        },
        required: ['base_url']
      }),
      supports_api_key: true,
      supports_webhook: true,
      webhook_events: JSON.stringify(['*'])
    }
  ]);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('connector_webhooks');
  await knex.schema.dropTableIfExists('connector_mappings');
  await knex.schema.dropTableIfExists('connector_sync_logs');
  await knex.schema.dropTableIfExists('tenant_connectors');
  await knex.schema.dropTableIfExists('connector_types');
}
