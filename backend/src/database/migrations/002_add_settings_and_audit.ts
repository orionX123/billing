
import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Tenant settings table
  await knex.schema.createTable('tenant_settings', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('tenant_id').references('id').inTable('tenants').onDelete('CASCADE').notNullable();
    table.json('settings').notNullable();
    table.uuid('created_by');
    table.uuid('updated_by');
    table.timestamps(true, true);
    
    table.unique(['tenant_id']);
    table.index(['tenant_id']);
  });

  // Audit logs table
  await knex.schema.createTable('audit_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('tenant_id').references('id').inTable('tenants').onDelete('CASCADE');
    table.uuid('user_id').references('id').inTable('users').onDelete('SET NULL');
    table.string('action', 100).notNullable();
    table.string('entity_type', 50).notNullable();
    table.uuid('entity_id');
    table.json('old_values');
    table.json('new_values');
    table.string('ip_address', 45);
    table.text('user_agent');
    table.timestamps(true, true);
    
    table.index(['tenant_id']);
    table.index(['user_id']);
    table.index(['action']);
    table.index(['entity_type']);
    table.index(['created_at']);
  });

  // System logs table (for super admin)
  await knex.schema.createTable('system_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.enum('level', ['error', 'warn', 'info', 'debug']).notNullable();
    table.string('message', 1000).notNullable();
    table.json('meta');
    table.timestamps(true, true);
    
    table.index(['level']);
    table.index(['created_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('system_logs');
  await knex.schema.dropTableIfExists('audit_logs');
  await knex.schema.dropTableIfExists('tenant_settings');
}
