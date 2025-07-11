
import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Tenants table
  await knex.schema.createTable('tenants', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 255).notNullable();
    table.string('email', 255).notNullable().unique();
    table.string('phone', 20);
    table.text('address');
    table.string('pan_number', 20);
    table.string('vat_number', 20);
    table.enum('subscription_plan', ['basic', 'standard', 'premium']).defaultTo('basic');
    table.integer('max_users').defaultTo(5);
    table.json('features').defaultTo('[]');
    table.enum('status', ['active', 'inactive', 'suspended']).defaultTo('active');
    table.uuid('created_by');
    table.uuid('updated_by');
    table.timestamps(true, true);
    
    table.index(['status']);
    table.index(['email']);
  });

  // Users table
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('email', 255).notNullable().unique();
    table.string('password_hash', 255).notNullable();
    table.string('full_name', 255).notNullable();
    table.enum('role', ['staff', 'manager', 'admin', 'superadmin']).notNullable();
    table.uuid('tenant_id').references('id').inTable('tenants').onDelete('CASCADE');
    table.boolean('is_active').defaultTo(true);
    table.timestamp('last_login');
    table.uuid('created_by');
    table.uuid('updated_by');
    table.timestamps(true, true);
    
    table.index(['email']);
    table.index(['tenant_id']);
    table.index(['role']);
    table.index(['is_active']);
  });

  // Customers table
  await knex.schema.createTable('customers', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('tenant_id').references('id').inTable('tenants').onDelete('CASCADE').notNullable();
    table.string('name', 255).notNullable();
    table.string('email', 255);
    table.string('phone', 20);
    table.text('address');
    table.string('pan_number', 20);
    table.string('vat_number', 20);
    table.string('contact_person', 255);
    table.decimal('credit_limit', 15, 2).defaultTo(0);
    table.string('payment_terms', 100).defaultTo('Net 30');
    table.boolean('is_active').defaultTo(true);
    table.uuid('created_by');
    table.uuid('updated_by');
    table.timestamps(true, true);
    
    table.index(['tenant_id']);
    table.index(['name']);
    table.index(['email']);
    table.index(['is_active']);
  });

  // Products table
  await knex.schema.createTable('products', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('tenant_id').references('id').inTable('tenants').onDelete('CASCADE').notNullable();
    table.string('name', 255).notNullable();
    table.text('description');
    table.string('sku', 100);
    table.string('barcode', 100);
    table.string('category', 100).notNullable();
    table.string('brand', 100);
    table.string('supplier', 255);
    table.decimal('price', 15, 2).notNullable();
    table.decimal('cost_price', 15, 2).defaultTo(0);
    table.string('unit', 20).defaultTo('pcs');
    table.integer('stock').defaultTo(0);
    table.integer('reorder_point').defaultTo(0);
    table.decimal('vat_rate', 5, 2).defaultTo(13);
    table.string('hsn_code', 20);
    table.boolean('is_active').defaultTo(true);
    table.uuid('created_by');
    table.uuid('updated_by');
    table.timestamps(true, true);
    
    table.index(['tenant_id']);
    table.index(['sku']);
    table.index(['barcode']);
    table.index(['category']);
    table.index(['is_active']);
    table.unique(['tenant_id', 'sku']);
  });

  // Invoices table
  await knex.schema.createTable('invoices', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('tenant_id').references('id').inTable('tenants').onDelete('CASCADE').notNullable();
    table.string('invoice_number', 50).notNullable();
    table.string('fiscal_year', 10).notNullable();
    table.uuid('customer_id').references('id').inTable('customers').notNullable();
    table.string('customer_name', 255).notNullable();
    table.string('customer_email', 255);
    table.string('customer_phone', 20);
    table.text('customer_address').notNullable();
    table.string('customer_pan', 20);
    table.date('invoice_date').notNullable();
    table.date('due_date').notNullable();
    table.decimal('subtotal', 15, 2).notNullable();
    table.decimal('total_discount', 15, 2).defaultTo(0);
    table.decimal('taxable_amount', 15, 2).notNullable();
    table.decimal('vat_amount', 15, 2).notNullable();
    table.decimal('total_amount', 15, 2).notNullable();
    table.enum('status', ['draft', 'sent', 'paid', 'overdue', 'cancelled']).defaultTo('draft');
    table.string('payment_terms', 100).defaultTo('Net 30');
    table.string('payment_method', 100);
    table.text('remarks');
    table.integer('print_count').defaultTo(0);
    table.boolean('synced_with_ird').defaultTo(false);
    table.boolean('is_active').defaultTo(true);
    table.uuid('created_by');
    table.uuid('updated_by');
    table.timestamps(true, true);
    
    table.index(['tenant_id']);
    table.index(['invoice_number']);
    table.index(['customer_id']);
    table.index(['invoice_date']);
    table.index(['status']);
    table.index(['is_active']);
    table.unique(['tenant_id', 'invoice_number']);
  });

  // Invoice items table
  await knex.schema.createTable('invoice_items', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('invoice_id').references('id').inTable('invoices').onDelete('CASCADE').notNullable();
    table.uuid('product_id').references('id').inTable('products').notNullable();
    table.string('product_name', 255).notNullable();
    table.string('hsn_code', 20);
    table.decimal('quantity', 15, 3).notNullable();
    table.string('unit', 20).notNullable();
    table.decimal('unit_price', 15, 2).notNullable();
    table.decimal('discount', 15, 2).defaultTo(0);
    table.decimal('vat_rate', 5, 2).defaultTo(13);
    table.decimal('total_amount', 15, 2).notNullable();
    table.timestamps(true, true);
    
    table.index(['invoice_id']);
    table.index(['product_id']);
  });

  // Stock movements table
  await knex.schema.createTable('stock_movements', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('tenant_id').references('id').inTable('tenants').onDelete('CASCADE').notNullable();
    table.uuid('product_id').references('id').inTable('products').onDelete('CASCADE').notNullable();
    table.enum('movement_type', ['add', 'subtract', 'set', 'sale', 'purchase', 'adjustment']).notNullable();
    table.decimal('quantity', 15, 3).notNullable();
    table.integer('previous_stock');
    table.integer('new_stock');
    table.text('reason');
    table.uuid('created_by');
    table.timestamps(true, true);
    
    table.index(['tenant_id']);
    table.index(['product_id']);
    table.index(['movement_type']);
    table.index(['created_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('stock_movements');
  await knex.schema.dropTableIfExists('invoice_items');
  await knex.schema.dropTableIfExists('invoices');
  await knex.schema.dropTableIfExists('products');
  await knex.schema.dropTableIfExists('customers');
  await knex.schema.dropTableIfExists('users');
  await knex.schema.dropTableIfExists('tenants');
}
