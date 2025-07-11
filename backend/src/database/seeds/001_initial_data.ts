
import { Knex } from 'knex';
import bcrypt from 'bcryptjs';

export async function seed(knex: Knex): Promise<void> {
  // Clear existing data
  await knex('stock_movements').del();
  await knex('invoice_items').del();
  await knex('invoices').del();
  await knex('products').del();
  await knex('customers').del();
  await knex('users').del();
  await knex('tenants').del();

  // Create sample tenants
  const tenants = await knex('tenants').insert([
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      name: 'Acme Corporation',
      email: 'admin@acme.com',
      phone: '+977-1-4444444',
      address: 'Kathmandu, Nepal',
      pan_number: '123456789',
      vat_number: '987654321',
      subscription_plan: 'premium',
      max_users: 50,
      features: JSON.stringify(['invoicing', 'inventory', 'reports', 'multi-user']),
      status: 'active',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      name: 'Beta Enterprises',
      email: 'admin@beta.com',
      phone: '+977-1-5555555',
      address: 'Pokhara, Nepal',
      subscription_plan: 'standard',
      max_users: 10,
      features: JSON.stringify(['invoicing', 'inventory']),
      status: 'active',
      created_at: new Date(),
      updated_at: new Date()
    }
  ]).returning('*');

  // Create users
  const hashedPassword = await bcrypt.hash('password123', 12);
  const staffPassword = await bcrypt.hash('staff123', 12);
  const managerPassword = await bcrypt.hash('manager123', 12);

  await knex('users').insert([
    // Super Admin
    {
      id: '550e8400-e29b-41d4-a716-446655440010',
      email: 'superadmin@system.com',
      password_hash: hashedPassword,
      full_name: 'Super Administrator',
      role: 'superadmin',
      tenant_id: null,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    // Acme Corporation Users
    {
      id: '550e8400-e29b-41d4-a716-446655440011',
      email: 'admin@acme.com',
      password_hash: hashedPassword,
      full_name: 'Acme Admin',
      role: 'admin',
      tenant_id: tenants[0].id,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440012',
      email: 'manager@acme.com',
      password_hash: managerPassword,
      full_name: 'Acme Manager',
      role: 'manager',
      tenant_id: tenants[0].id,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440013',
      email: 'staff@acme.com',
      password_hash: staffPassword,
      full_name: 'Acme Staff',
      role: 'staff',
      tenant_id: tenants[0].id,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    // Beta Enterprises Users
    {
      id: '550e8400-e29b-41d4-a716-446655440014',
      email: 'admin@beta.com',
      password_hash: hashedPassword,
      full_name: 'Beta Admin',
      role: 'admin',
      tenant_id: tenants[1].id,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);

  // Create sample customers for Acme
  await knex('customers').insert([
    {
      id: '550e8400-e29b-41d4-a716-446655440020',
      tenant_id: tenants[0].id,
      name: 'Tech Solutions Pvt. Ltd.',
      email: 'contact@techsolutions.com',
      phone: '+977-9841234567',
      address: 'Baneshwor, Kathmandu',
      pan_number: '111222333',
      contact_person: 'John Doe',
      credit_limit: 100000,
      payment_terms: 'Net 30',
      created_by: '550e8400-e29b-41d4-a716-446655440011',
      updated_by: '550e8400-e29b-41d4-a716-446655440011',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440021',
      tenant_id: tenants[0].id,
      name: 'Digital Marketing Co.',
      email: 'info@digitalmarketing.com',
      phone: '+977-9851234567',
      address: 'Thamel, Kathmandu',
      pan_number: '444555666',
      contact_person: 'Jane Smith',
      credit_limit: 50000,
      payment_terms: 'Net 15',
      created_by: '550e8400-e29b-41d4-a716-446655440011',
      updated_by: '550e8400-e29b-41d4-a716-446655440011',
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);

  // Create sample products for Acme
  await knex('products').insert([
    {
      id: '550e8400-e29b-41d4-a716-446655440030',
      tenant_id: tenants[0].id,
      name: 'Dell Laptop Inspiron 15',
      description: '15.6" FHD Display, Intel i5, 8GB RAM, 512GB SSD',
      sku: 'DELL-INS-15-001',
      barcode: '1234567890123',
      category: 'Electronics',
      brand: 'Dell',
      supplier: 'Dell Nepal',
      price: 75000,
      cost_price: 65000,
      unit: 'pcs',
      stock: 25,
      reorder_point: 5,
      vat_rate: 13,
      hsn_code: '8471',
      created_by: '550e8400-e29b-41d4-a716-446655440011',
      updated_by: '550e8400-e29b-41d4-a716-446655440011',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440031',
      tenant_id: tenants[0].id,
      name: 'HP Printer LaserJet Pro',
      description: 'Monochrome Laser Printer with Wi-Fi',
      sku: 'HP-LJ-PRO-001',
      barcode: '1234567890124',
      category: 'Electronics',
      brand: 'HP',
      supplier: 'HP Nepal',
      price: 25000,
      cost_price: 20000,
      unit: 'pcs',
      stock: 15,
      reorder_point: 3,
      vat_rate: 13,
      hsn_code: '8443',
      created_by: '550e8400-e29b-41d4-a716-446655440011',
      updated_by: '550e8400-e29b-41d4-a716-446655440011',
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);

  console.log('✅ Database seeded successfully');
  console.log('🔑 Login credentials:');
  console.log('   Super Admin: superadmin@system.com / password123');
  console.log('   Acme Admin: admin@acme.com / password123');
  console.log('   Acme Manager: manager@acme.com / manager123');
  console.log('   Acme Staff: staff@acme.com / staff123');
  console.log('   Beta Admin: admin@beta.com / password123');
}
