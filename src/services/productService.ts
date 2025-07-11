
export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  status: 'Active' | 'Inactive';
  barcode?: string;
  description?: string;
  vatRate: number;
  hsnCode?: string;
  unitOfMeasure: string;
  minStockLevel: number;
  reorderPoint: number;
  supplierInfo?: string;
  createdDate: string;
  updatedDate: string;
  createdBy: string;
  updatedBy: string;
  // Additional properties for compatibility
  costPrice: number;
  unit: string;
  stockQuantity: number;
  brand?: string;
  supplier?: string;
  isActive: boolean;
}

const products: Product[] = [
  {
    id: "PROD-001",
    name: "Coca-Cola 500ml",
    sku: "CC-500",
    category: "Beverages",
    price: 50,
    stock: 100,
    status: 'Active',
    barcode: "1234567890123",
    vatRate: 13,
    unitOfMeasure: "pcs",
    minStockLevel: 10,
    reorderPoint: 20,
    createdDate: "2024-07-01",
    updatedDate: "2024-07-01",
    createdBy: "admin",
    updatedBy: "admin",
    costPrice: 40,
    unit: "pieces",
    stockQuantity: 100,
    isActive: true,
  },
  {
    id: "PROD-002",
    name: "Sprite 500ml",
    sku: "SP-500",
    category: "Beverages",
    price: 45,
    stock: 80,
    status: 'Active',
    barcode: "1234567890124",
    vatRate: 13,
    unitOfMeasure: "pcs",
    minStockLevel: 10,
    reorderPoint: 20,
    createdDate: "2024-07-01",
    updatedDate: "2024-07-01",
    createdBy: "admin",
    updatedBy: "admin",
    costPrice: 35,
    unit: "pieces",
    stockQuantity: 80,
    isActive: true,
  },
  {
    id: "PROD-003",
    name: "Fanta 500ml",
    sku: "FA-500",
    category: "Beverages",
    price: 45,
    stock: 120,
    status: 'Active',
    barcode: "1234567890125",
    vatRate: 13,
    unitOfMeasure: "pcs",
    minStockLevel: 10,
    reorderPoint: 20,
    createdDate: "2024-07-01",
    updatedDate: "2024-07-01",
    createdBy: "admin",
    updatedBy: "admin",
    costPrice: 35,
    unit: "pieces",
    stockQuantity: 120,
    isActive: true,
  },
  {
    id: "PROD-004",
    name: "Pepsi 500ml",
    sku: "PE-500",
    category: "Beverages",
    price: 50,
    stock: 90,
    status: 'Active',
    barcode: "1234567890126",
    vatRate: 13,
    unitOfMeasure: "pcs",
    minStockLevel: 10,
    reorderPoint: 20,
    createdDate: "2024-07-01",
    updatedDate: "2024-07-01",
    createdBy: "admin",
    updatedBy: "admin",
    costPrice: 40,
    unit: "pieces",
    stockQuantity: 90,
    isActive: true,
  },
  {
    id: "PROD-005",
    name: "Dairy Milk Chocolate",
    sku: "DM-CHOCO",
    category: "Snacks",
    price: 100,
    stock: 150,
    status: 'Active',
    barcode: "1234567890127",
    vatRate: 5,
    unitOfMeasure: "pcs",
    minStockLevel: 15,
    reorderPoint: 30,
    createdDate: "2024-07-01",
    updatedDate: "2024-07-01",
    createdBy: "admin",
    updatedBy: "admin",
    costPrice: 80,
    unit: "pieces",
    stockQuantity: 150,
    brand: "Cadbury",
    isActive: true,
  },
  {
    id: "PROD-006",
    name: "Lays Chips",
    sku: "LC-CHIPS",
    category: "Snacks",
    price: 80,
    stock: 200,
    status: 'Active',
    barcode: "1234567890128",
    vatRate: 5,
    unitOfMeasure: "pcs",
    minStockLevel: 20,
    reorderPoint: 40,
    createdDate: "2024-07-01",
    updatedDate: "2024-07-01",
    createdBy: "admin",
    updatedBy: "admin",
    costPrice: 60,
    unit: "pieces",
    stockQuantity: 200,
    brand: "Lays",
    isActive: true,
  },
  {
    id: "PROD-007",
    name: "Kurkure",
    sku: "KU-SNACK",
    category: "Snacks",
    price: 75,
    stock: 180,
    status: 'Active',
    barcode: "1234567890129",
    vatRate: 5,
    unitOfMeasure: "pcs",
    minStockLevel: 15,
    reorderPoint: 30,
    createdDate: "2024-07-01",
    updatedDate: "2024-07-01",
    createdBy: "admin",
    updatedBy: "admin",
    costPrice: 55,
    unit: "pieces",
    stockQuantity: 180,
    brand: "Kurkure",
    isActive: true,
  },
  {
    id: "PROD-008",
    name: "Wai Wai",
    sku: "WW-NOODLE",
    category: "Noodles",
    price: 30,
    stock: 250,
    status: 'Active',
    barcode: "1234567890130",
    vatRate: 0,
    unitOfMeasure: "pcs",
    minStockLevel: 25,
    reorderPoint: 50,
    createdDate: "2024-07-01",
    updatedDate: "2024-07-01",
    createdBy: "admin",
    updatedBy: "admin",
    costPrice: 25,
    unit: "pieces",
    stockQuantity: 250,
    brand: "Wai Wai",
    isActive: true,
  },
  {
    id: "PROD-009",
    name: "Rara Noodles",
    sku: "RR-NOODLE",
    category: "Noodles",
    price: 35,
    stock: 220,
    status: 'Active',
    barcode: "1234567890131",
    vatRate: 0,
    unitOfMeasure: "pcs",
    minStockLevel: 20,
    reorderPoint: 40,
    createdDate: "2024-07-01",
    updatedDate: "2024-07-01",
    createdBy: "admin",
    updatedBy: "admin",
    costPrice: 28,
    unit: "pieces",
    stockQuantity: 220,
    brand: "Rara",
    isActive: true,
  },
  {
    id: "PROD-010",
    name: "Maggi",
    sku: "MG-NOODLE",
    category: "Noodles",
    price: 40,
    stock: 190,
    status: 'Active',
    barcode: "1234567890132",
    vatRate: 0,
    unitOfMeasure: "pcs",
    minStockLevel: 15,
    reorderPoint: 30,
    createdDate: "2024-07-01",
    updatedDate: "2024-07-01",
    createdBy: "admin",
    updatedBy: "admin",
    costPrice: 32,
    unit: "pieces",
    stockQuantity: 190,
    brand: "Maggi",
    isActive: true,
  },
];

const getAllProducts = (): Product[] => {
  return products;
};

const getProductById = (id: string): Product | undefined => {
  return products.find(product => product.id === id);
};

const createProduct = (product: Omit<Product, 'id' | 'createdDate'>): Product => {
  const newProduct: Product = {
    id: `PROD-${Date.now()}`,
    createdDate: new Date().toISOString(),
    ...product,
  };
  products.push(newProduct);
  return newProduct;
};

const updateProduct = (id: string, updates: Partial<Product>): Product | undefined => {
  const productIndex = products.findIndex(product => product.id === id);
  if (productIndex === -1) {
    return undefined;
  }

  products[productIndex] = { ...products[productIndex], ...updates };
  return products[productIndex];
};

const deleteProduct = (id: string): boolean => {
  const productIndex = products.findIndex(product => product.id === id);
  if (productIndex === -1) {
    return false;
  }

  products.splice(productIndex, 1);
  return true;
};

const updateStock = (productId: string, quantity: number, operation: 'add' | 'subtract'): void => {
  const product = products.find(p => p.id === productId);
  if (product) {
    product.stock = operation === 'add' ? product.stock + quantity : product.stock - quantity;
    product.stockQuantity = product.stock; // Keep both in sync
  }
};

const getLowStockProducts = (): Product[] => {
  return products.filter(product => product.stock <= product.minStockLevel && product.isActive);
};

const getCategories = (): string[] => {
  return Array.from(new Set(products.map(product => product.category)));
};

export const productService = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  getLowStockProducts,
  getCategories
};
