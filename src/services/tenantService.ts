export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  businessType: 'retail' | 'restaurant' | 'service' | 'wholesale';
  address: string;
  phone: string;
  email: string;
  panNumber: string;
  vatNumber: string;
  fiscalYear: string;
  status: 'active' | 'suspended' | 'trial' | 'expired';
  plan: 'basic' | 'standard' | 'premium' | 'enterprise';
  maxUsers: number;
  maxLocations: number;
  features: string[];
  createdDate: string;
  expiryDate: string;
  ownerId: string;
  settings: {
    currency: string;
    timezone: string;
    language: string;
    dateFormat: string;
    taxSettings: {
      defaultVatRate: number;
      enableTax: boolean;
      taxNumber: string;
    };
    posSettings: {
      enableBarcode: boolean;
      enableInventoryTracking: boolean;
      enableCustomerDisplay: boolean;
      enableReceiptPrinter: boolean;
      defaultPaymentMethod: string;
    };
  };
}

export interface TenantUser {
  id: string;
  tenantId: string;
  username: string;
  email: string;
  fullName: string;
  role: 'staff' | 'manager' | 'admin';
  permissions: string[];
  status: 'active' | 'inactive';
  lastLogin?: string;
  createdDate: string;
}

const TENANTS_STORAGE_KEY = 'system_tenants';
const TENANT_USERS_STORAGE_KEY = 'tenant_users';

const defaultTenants: Tenant[] = [
  {
    id: "TENANT-001",
    name: "ABC Trading Pvt Ltd",
    subdomain: "abc-trading",
    businessType: "retail",
    address: "Kathmandu, Nepal",
    phone: "+977-1-4567890",
    email: "admin@abctrading.com",
    panNumber: "123456789",
    vatNumber: "123456789",
    fiscalYear: "2081-82",
    status: "active",
    plan: "premium",
    maxUsers: 10,
    maxLocations: 3,
    features: ["pos", "inventory", "reports", "multi-location", "api-access"],
    createdDate: "2024-01-15",
    expiryDate: "2025-01-15",
    ownerId: "USER-001",
    settings: {
      currency: "NPR",
      timezone: "Asia/Kathmandu",
      language: "en",
      dateFormat: "YYYY-MM-DD",
      taxSettings: {
        defaultVatRate: 13,
        enableTax: true,
        taxNumber: "123456789"
      },
      posSettings: {
        enableBarcode: true,
        enableInventoryTracking: true,
        enableCustomerDisplay: false,
        enableReceiptPrinter: true,
        defaultPaymentMethod: "cash"
      }
    }
  }
];

const defaultTenantUsers: TenantUser[] = [
  {
    id: "TUSER-001",
    tenantId: "TENANT-001",
    username: "admin",
    email: "admin@abctrading.com",
    fullName: "John Admin",
    role: "admin",
    permissions: ["all"],
    status: "active",
    lastLogin: "2024-07-05 15:30:00",
    createdDate: "2024-01-15"
  }
];

export const tenantService = {
  // Tenant Management
  getAllTenants: (): Tenant[] => {
    const stored = localStorage.getItem(TENANTS_STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(TENANTS_STORAGE_KEY, JSON.stringify(defaultTenants));
      return defaultTenants;
    }
    return JSON.parse(stored);
  },

  getTenantById: (id: string): Tenant | null => {
    const tenants = tenantService.getAllTenants();
    return tenants.find(tenant => tenant.id === id) || null;
  },

  getTenantBySubdomain: (subdomain: string): Tenant | null => {
    const tenants = tenantService.getAllTenants();
    return tenants.find(tenant => tenant.subdomain === subdomain) || null;
  },

  createTenant: (tenantData: Omit<Tenant, 'id' | 'createdDate'>): Tenant => {
    const tenants = tenantService.getAllTenants();
    const newTenant: Tenant = {
      ...tenantData,
      id: `TENANT-${String(tenants.length + 1).padStart(3, '0')}`,
      createdDate: new Date().toISOString().split('T')[0]
    };
    
    tenants.push(newTenant);
    localStorage.setItem(TENANTS_STORAGE_KEY, JSON.stringify(tenants));
    return newTenant;
  },

  updateTenant: (id: string, updates: Partial<Tenant>): Tenant | null => {
    const tenants = tenantService.getAllTenants();
    const index = tenants.findIndex(tenant => tenant.id === id);
    
    if (index === -1) return null;
    
    tenants[index] = { ...tenants[index], ...updates };
    localStorage.setItem(TENANTS_STORAGE_KEY, JSON.stringify(tenants));
    return tenants[index];
  },

  suspendTenant: (id: string): boolean => {
    return !!tenantService.updateTenant(id, { status: 'suspended' });
  },

  activateTenant: (id: string): boolean => {
    return !!tenantService.updateTenant(id, { status: 'active' });
  },

  // Tenant Users Management
  getTenantUsers: (tenantId: string): TenantUser[] => {
    const stored = localStorage.getItem(TENANT_USERS_STORAGE_KEY);
    const allUsers = stored ? JSON.parse(stored) : defaultTenantUsers;
    return allUsers.filter((user: TenantUser) => user.tenantId === tenantId);
  },

  createTenantUser: (userData: Omit<TenantUser, 'id' | 'createdDate'>): TenantUser => {
    const stored = localStorage.getItem(TENANT_USERS_STORAGE_KEY);
    const allUsers = stored ? JSON.parse(stored) : defaultTenantUsers;
    
    const newUser: TenantUser = {
      ...userData,
      id: `TUSER-${String(allUsers.length + 1).padStart(3, '0')}`,
      createdDate: new Date().toISOString().split('T')[0]
    };
    
    allUsers.push(newUser);
    localStorage.setItem(TENANT_USERS_STORAGE_KEY, JSON.stringify(allUsers));
    return newUser;
  },

  updateTenantUser: (id: string, updates: Partial<TenantUser>): TenantUser | null => {
    const stored = localStorage.getItem(TENANT_USERS_STORAGE_KEY);
    const allUsers = stored ? JSON.parse(stored) : defaultTenantUsers;
    const index = allUsers.findIndex((user: TenantUser) => user.id === id);
    
    if (index === -1) return null;
    
    allUsers[index] = { ...allUsers[index], ...updates };
    localStorage.setItem(TENANT_USERS_STORAGE_KEY, JSON.stringify(allUsers));
    return allUsers[index];
  }
};