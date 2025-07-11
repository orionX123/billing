
import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Add external integration columns to products table
  await knex.schema.alterTable('products', (table) => {
    table.string('external_id', 100).nullable();
    table.string('external_source', 50).nullable(); // 'shopify', 'woocommerce', etc.
    table.json('external_data').nullable(); // Store additional external system data
    table.timestamp('last_sync').nullable();
  });

  // Add external integration columns to customers table  
  await knex.schema.alterTable('customers', (table) => {
    table.string('external_id', 100).nullable();
    table.string('external_source', 50).nullable();
    table.json('external_data').nullable();
    table.timestamp('last_sync').nullable();
  });

  // Add external integration columns to invoices table
  await knex.schema.alterTable('invoices', (table) => {
    table.string('external_id', 100).nullable();
    table.string('external_source', 50).nullable(); 
    table.json('external_data').nullable();
    table.timestamp('last_sync').nullable();
  });

  // Create stock movements table for inventory tracking
  await knex.schema.createTable('stock_movements', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('product_id').references('id').inTable('products').onDelete('CASCADE').notNullable();
    table.uuid('tenant_id').references('id').inTable('tenants').onDelete('CASCADE').notNullable();
    table.enum('movement_type', ['sale', 'purchase', 'adjustment', 'return']).notNullable();
    table.decimal('quantity', 10, 2).notNullable(); // Can be negative for outbound
    table.decimal('unit_cost', 10, 2).nullable();
    table.string('reference_type', 50).nullable(); // 'invoice', 'purchase_order', etc.
    table.uuid('reference_id').nullable();
    table.string('reason', 255).nullable();
    table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index(['product_id']);
    table.index(['tenant_id']);
    table.index(['movement_type']);
    table.index(['created_at']);
  });

  // Create connector field mappings for flexible data mapping
  await knex.schema.createTable('connector_field_mappings', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('tenant_connector_id').references('id').inTable('tenant_connectors').onDelete('CASCADE').notNullable();
    table.string('entity_type', 50).notNullable(); // 'product', 'customer', 'invoice'
    table.string('local_field', 100).notNullable(); // Field name in our system
    table.string('external_field', 100).notNullable(); // Field name in external system
    table.enum('mapping_type', ['direct', 'transform', 'static']).defaultTo('direct');
    table.text('transform_rule').nullable(); // JS function or JSON rule for transformation
    table.json('static_value').nullable(); // Static value for static mappings
    table.boolean('is_required').defaultTo(false);
    table.timestamps(true, true);

    table.unique(['tenant_connector_id', 'entity_type', 'local_field']);
    table.index(['tenant_connector_id']);
    table.index(['entity_type']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('connector_field_mappings');
  await knex.schema.dropTableIfExists('stock_movements');
  
  await knex.schema.alterTable('invoices', (table) => {
    table.dropColumn('external_id');
    table.dropColumn('external_source');
    table.dropColumn('external_data');
    table.dropColumn('last_sync');
  });

  await knex.schema.alterTable('customers', (table) => {
    table.dropColumn('external_id');
    table.dropColumn('external_source');
    table.dropColumn('external_data');
    table.dropColumn('last_sync');
  });

  await knex.schema.alterTable('products', (table) => {
    table.dropColumn('external_id');
    table.dropColumn('external_source');
    table.dropColumn('external_data');
    table.dropColumn('last_sync');
  });
}
