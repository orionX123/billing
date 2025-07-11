
# IRD Billing System Backend

A production-ready Node.js backend for the IRD Billing System with multi-tenant architecture.

## Features

- **Multi-tenant Architecture**: Complete tenant isolation with role-based access control
- **Authentication & Authorization**: JWT-based auth with role permissions
- **Database**: PostgreSQL with Knex.js ORM and migrations
- **Transaction Support**: ACID transactions for data consistency
- **Rate Limiting**: Configurable rate limiting and slow down protection
- **Comprehensive Logging**: Winston-based structured logging
- **API Documentation**: RESTful API with comprehensive validation
- **Production Ready**: Error handling, security middleware, and performance optimization

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Knex.js
- **Authentication**: JWT with bcrypt
- **Validation**: Joi
- **Security**: Helmet, CORS, Rate limiting
- **Logging**: Winston
- **Process Management**: PM2 ready

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 12+
- Redis (optional, for advanced rate limiting)

### Installation

1. Clone and install dependencies:
```bash
cd backend
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Set up database:
```bash
# Create database
createdb ird_billing_dev

# Run migrations
npm run migrate

# Seed initial data
npm run seed
```

4. Start development server:
```bash
npm run dev
```

The API will be available at `http://localhost:3001`

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration (tenant users)

### Tenants (Super Admin only)
- `GET /api/tenants` - List all tenants
- `POST /api/tenants` - Create tenant
- `GET /api/tenants/:id` - Get tenant details
- `PUT /api/tenants/:id` - Update tenant
- `DELETE /api/tenants/:id` - Deactivate tenant

### Users
- `GET /api/users` - List users (tenant isolated)
- `POST /api/users` - Create user
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update profile
- `PUT /api/users/password` - Change password
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Deactivate user

### Customers
- `GET /api/customers` - List customers
- `POST /api/customers` - Create customer
- `GET /api/customers/:id` - Get customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Products
- `GET /api/products` - List products
- `GET /api/products/categories` - Get categories
- `GET /api/products/low-stock` - Get low stock products
- `POST /api/products` - Create product
- `GET /api/products/:id` - Get product
- `PUT /api/products/:id` - Update product
- `PATCH /api/products/:id/stock` - Update stock
- `DELETE /api/products/:id` - Delete product

### Invoices
- `GET /api/invoices` - List invoices
- `POST /api/invoices` - Create invoice
- `GET /api/invoices/:id` - Get invoice with items
- `PUT /api/invoices/:id` - Update invoice
- `POST /api/invoices/:id/print` - Print invoice
- `DELETE /api/invoices/:id` - Delete invoice

### Reports
- `GET /api/reports/sales-summary` - Sales summary report
- `GET /api/reports/product-performance` - Product performance
- `GET /api/reports/customer-analysis` - Customer analysis
- `GET /api/reports/tax-summary` - Tax/VAT summary
- `GET /api/reports/inventory` - Inventory report

## Database Schema

### Core Tables
- `tenants` - Multi-tenant organization data
- `users` - User accounts with role-based access
- `customers` - Customer information
- `products` - Product catalog with inventory
- `invoices` - Invoice headers
- `invoice_items` - Invoice line items
- `stock_movements` - Stock transaction log

### Key Features
- **UUID Primary Keys**: For security and scalability
- **Soft Deletes**: Data preservation with `is_active` flags
- **Audit Trail**: Created/updated timestamps and user tracking
- **Tenant Isolation**: All data scoped by tenant_id
- **Indexes**: Optimized for common queries

## Security Features

- **Authentication**: JWT tokens with secure headers
- **Authorization**: Role-based access control (RBAC)
- **Tenant Isolation**: Complete data separation
- **Rate Limiting**: Configurable limits per endpoint
- **Input Validation**: Joi schema validation
- **SQL Injection Prevention**: Parameterized queries
- **Password Security**: Bcrypt hashing
- **CORS Protection**: Configurable origins
- **Security Headers**: Helmet middleware

## Production Deployment

### Environment Setup
```bash
NODE_ENV=production
DB_HOST=your-db-host
DB_NAME=ird_billing_prod
JWT_SECRET=your-very-secure-secret
```

### Using PM2
```bash
npm install -g pm2
npm run build
pm2 start dist/index.js --name "ird-billing-api"
```

### Database Migration in Production
```bash
NODE_ENV=production npm run migrate
```

## Default Login Credentials

After seeding, use these credentials:

- **Super Admin**: `superadmin@system.com` / `password123`
- **Acme Admin**: `admin@acme.com` / `password123`
- **Acme Manager**: `manager@acme.com` / `manager123`
- **Acme Staff**: `staff@acme.com` / `staff123`
- **Beta Admin**: `admin@beta.com` / `password123`

## Development Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run migrate      # Run database migrations
npm run migrate:rollback # Rollback migrations
npm run seed         # Seed database
npm run lint         # Run ESLint
npm run format       # Format with Prettier
npm test             # Run tests
```

## Architecture Highlights

### Multi-Tenant Design
- **Tenant Isolation**: Complete data separation per organization
- **Role Hierarchy**: superadmin > admin > manager > staff
- **Feature Gating**: Subscription-based feature access
- **Scalable**: Supports thousands of tenants

### Transaction Management
- **ACID Compliance**: Database transactions for consistency
- **Stock Management**: Automatic inventory updates
- **Audit Logging**: Complete transaction history
- **Rollback Support**: Safe operation reversals

### Performance Optimizations
- **Connection Pooling**: Optimized database connections
- **Query Optimization**: Indexed columns and efficient queries
- **Caching Ready**: Redis integration prepared
- **Compression**: Gzip compression enabled
- **Rate Limiting**: Protection against abuse

## Contributing

1. Follow TypeScript best practices
2. Write comprehensive tests
3. Update documentation
4. Use conventional commits
5. Ensure security best practices

## License

Proprietary - All rights reserved
