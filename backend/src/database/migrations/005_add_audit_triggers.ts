
import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create audit trigger function
  await knex.raw(`
    CREATE OR REPLACE FUNCTION audit_trigger_function()
    RETURNS trigger AS $$
    DECLARE
        audit_row audit_logs%ROWTYPE;
        old_data TEXT;
        new_data TEXT;
    BEGIN
        IF TG_WHEN <> 'AFTER' THEN
            RAISE EXCEPTION 'audit_trigger_function() may only run as an AFTER trigger';
        END IF;

        audit_row.tenant_id = COALESCE(NEW.tenant_id, OLD.tenant_id);
        audit_row.entity_type = TG_TABLE_NAME::TEXT;
        audit_row.action = TG_OP;
        audit_row.created_at = CURRENT_TIMESTAMP;

        IF TG_OP = 'UPDATE' THEN
            audit_row.entity_id = NEW.id;
            audit_row.old_values = to_jsonb(OLD);
            audit_row.new_values = to_jsonb(NEW);
        ELSIF TG_OP = 'DELETE' THEN
            audit_row.entity_id = OLD.id;
            audit_row.old_values = to_jsonb(OLD);
        ELSIF TG_OP = 'INSERT' THEN
            audit_row.entity_id = NEW.id;
            audit_row.new_values = to_jsonb(NEW);
        END IF;

        INSERT INTO audit_logs VALUES (audit_row.*);
        RETURN NULL;
    END;
    $$ LANGUAGE plpgsql;
  `);

  // Add audit triggers to important tables
  const auditTables = [
    'invoices',
    'customers', 
    'products',
    'users',
    'tenant_connectors',
    'tenant_settings'
  ];

  for (const table of auditTables) {
    await knex.raw(`
      CREATE TRIGGER audit_trigger_${table}
      AFTER INSERT OR UPDATE OR DELETE ON ${table}
      FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
    `);
  }

  // Add indexes for better performance
  await knex.schema.alterTable('products', (table) => {
    table.index(['tenant_id', 'external_id']);
    table.index(['tenant_id', 'sku']);
    table.index(['external_source']);
  });

  await knex.schema.alterTable('customers', (table) => {
    table.index(['tenant_id', 'external_id']);
    table.index(['external_source']);  
  });

  await knex.schema.alterTable('invoices', (table) => {
    table.index(['tenant_id', 'status']);
    table.index(['tenant_id', 'invoice_date']);
    table.index(['tenant_id', 'customer_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  const auditTables = [
    'invoices',
    'customers',
    'products', 
    'users',
    'tenant_connectors',
    'tenant_settings'
  ];

  for (const table of auditTables) {
    await knex.raw(`DROP TRIGGER IF EXISTS audit_trigger_${table} ON ${table};`);
  }

  await knex.raw(`DROP FUNCTION IF EXISTS audit_trigger_function();`);
}
