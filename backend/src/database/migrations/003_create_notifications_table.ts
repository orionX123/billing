
import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('notifications', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('tenant_id').notNullable();
    table.uuid('user_id').nullable(); // null means notification for all users in tenant
    table.enum('type', ['info', 'warning', 'error', 'success']).notNullable();
    table.enum('category', ['system', 'inventory', 'invoice', 'user', 'payment']).notNullable();
    table.string('title', 255).notNullable();
    table.text('message').notNullable();
    table.enum('priority', ['low', 'medium', 'high', 'critical']).defaultTo('medium');
    table.string('entity_type').nullable();
    table.uuid('entity_id').nullable();
    table.string('action_url', 500).nullable();
    table.boolean('is_read').defaultTo(false);
    table.timestamp('read_at').nullable();
    table.timestamp('expires_at').nullable();
    table.uuid('created_by').nullable();
    table.timestamps(true, true);

    // Indexes
    table.index(['tenant_id', 'user_id']);
    table.index(['tenant_id', 'is_read']);
    table.index(['tenant_id', 'category']);
    table.index(['tenant_id', 'priority']);
    table.index(['expires_at']);
    table.index(['created_at']);

    // Foreign keys
    table.foreign('tenant_id').references('id').inTable('tenants').onDelete('CASCADE');
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('created_by').references('id').inTable('users').onDelete('SET NULL');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('notifications');
}
