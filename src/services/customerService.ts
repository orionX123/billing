
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  vatNumber: string;
  panNumber: string;
  status: 'Active' | 'Inactive';
  totalOrders: number;
  totalAmount: string;
  createdDate: string;
  updatedDate: string;
  customerType: 'Individual' | 'Business';
  billingAddress?: string;
  shippingAddress?: string;
  creditLimit?: number;
  paymentTerms?: string;
}

const STORAGE_KEY = 'ird_customers';

// Default sample data for initial load
const defaultCustomers: Customer[] = [
  {
    id: "CUST-001",
    name: "ABC Trading Pvt Ltd",
    email: "contact@abctrading.com",
    phone: "+977-1-4567890",
    address: "Kathmandu, Nepal",
    vatNumber: "123456789",
    panNumber: "123456789",
    status: "Active",
    totalOrders: 15,
    totalAmount: "NPR 2,45,000",
    createdDate: "2024-01-15",
    updatedDate: "2024-07-01",
    customerType: "Business",
    billingAddress: "Kathmandu, Nepal",
    creditLimit: 500000,
    paymentTerms: "Net 30"
  },
  {
    id: "CUST-002", 
    name: "XYZ Corporation",
    email: "info@xyzcorp.com",
    phone: "+977-1-9876543",
    address: "Lalitpur, Nepal",
    vatNumber: "987654321",
    panNumber: "987654321",
    status: "Active",
    totalOrders: 8,
    totalAmount: "NPR 1,20,500",
    createdDate: "2024-02-20",
    updatedDate: "2024-06-15",
    customerType: "Business",
    billingAddress: "Lalitpur, Nepal",
    creditLimit: 300000,
    paymentTerms: "Net 15"
  },
  {
    id: "CUST-003",
    name: "Global Imports",
    email: "orders@globalimports.com", 
    phone: "+977-1-5555555",
    address: "Bhaktapur, Nepal",
    vatNumber: "555666777",
    panNumber: "555666777",
    status: "Inactive",
    totalOrders: 23,
    totalAmount: "NPR 4,56,800",
    createdDate: "2024-03-10",
    updatedDate: "2024-05-20",
    customerType: "Business",
    billingAddress: "Bhaktapur, Nepal",
    creditLimit: 800000,
    paymentTerms: "Net 45"
  },
  {
    id: "CUST-004",
    name: "Tech Solutions",
    email: "hello@techsolutions.com",
    phone: "+977-1-1111111",
    address: "Pokhara, Nepal", 
    vatNumber: "111222333",
    panNumber: "111222333",
    status: "Active",
    totalOrders: 12,
    totalAmount: "NPR 1,87,200",
    createdDate: "2024-04-05",
    updatedDate: "2024-06-30",
    customerType: "Business",
    billingAddress: "Pokhara, Nepal",
    creditLimit: 400000,
    paymentTerms: "Net 30"
  }
];

export const customerService = {
  // Get all customers
  getAllCustomers: (): Customer[] => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultCustomers));
      return defaultCustomers;
    }
    return JSON.parse(stored);
  },

  // Get customer by ID
  getCustomerById: (id: string): Customer | null => {
    const customers = customerService.getAllCustomers();
    return customers.find(customer => customer.id === id) || null;
  },

  // Create new customer
  createCustomer: (customerData: Omit<Customer, 'id' | 'createdDate' | 'updatedDate' | 'totalOrders' | 'totalAmount'>): Customer => {
    const customers = customerService.getAllCustomers();
    const newCustomer: Customer = {
      ...customerData,
      id: `CUST-${String(customers.length + 1).padStart(3, '0')}`,
      createdDate: new Date().toISOString().split('T')[0],
      updatedDate: new Date().toISOString().split('T')[0],
      totalOrders: 0,
      totalAmount: "NPR 0"
    };
    
    customers.push(newCustomer);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
    return newCustomer;
  },

  // Update customer
  updateCustomer: (id: string, updates: Partial<Customer>): Customer | null => {
    const customers = customerService.getAllCustomers();
    const index = customers.findIndex(customer => customer.id === id);
    
    if (index === -1) return null;
    
    customers[index] = {
      ...customers[index],
      ...updates,
      updatedDate: new Date().toISOString().split('T')[0]
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
    return customers[index];
  },

  // Delete customer
  deleteCustomer: (id: string): boolean => {
    const customers = customerService.getAllCustomers();
    const filteredCustomers = customers.filter(customer => customer.id !== id);
    
    if (filteredCustomers.length === customers.length) return false;
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredCustomers));
    return true;
  },

  // Search customers
  searchCustomers: (searchTerm: string): Customer[] => {
    const customers = customerService.getAllCustomers();
    return customers.filter(customer =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.vatNumber.includes(searchTerm) ||
      customer.panNumber.includes(searchTerm)
    );
  }
};
