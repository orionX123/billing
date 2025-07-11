
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface InvoiceItem {
  id: string;
  productId: string;
  productName: string;
  hsnCode?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount: number;
  vatRate: number;
  totalAmount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  fiscalYear: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  customerPAN: string;
  invoiceDate: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  totalDiscount: number;
  taxableAmount: number;
  vatAmount: number;
  totalAmount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  paymentTerms: string;
  paymentMethod?: string;
  remarks?: string;
  printCount: number;
  syncedWithIRD: boolean;
  createdDate: string;
  updatedDate: string;
  createdBy: string;
  updatedBy: string;
  isActive: boolean;
}

interface InvoiceResponse {
  invoices: Invoice[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

export const invoiceService = {
  getAllInvoices: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    customer_id?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<InvoiceResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.customer_id) queryParams.append('customer_id', params.customer_id);
    if (params?.date_from) queryParams.append('date_from', params.date_from);
    if (params?.date_to) queryParams.append('date_to', params.date_to);

    const response = await fetch(`${API_BASE_URL}/invoices?${queryParams}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch invoices');
    }

    return response.json();
  },

  getInvoiceById: async (id: string): Promise<Invoice> => {
    const response = await fetch(`${API_BASE_URL}/invoices/${id}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Invoice with id ${id} not found`);
    }

    return response.json();
  },

  createInvoice: async (invoiceData: Omit<Invoice, 'id' | 'createdDate' | 'updatedDate' | 'isActive' | 'invoiceNumber' | 'printCount' | 'syncedWithIRD'>): Promise<Invoice> => {
    const response = await fetch(`${API_BASE_URL}/invoices`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(invoiceData),
    });

    if (!response.ok) {
      throw new Error('Failed to create invoice');
    }

    return response.json();
  },

  updateInvoice: async (id: string, updates: Partial<Invoice>): Promise<Invoice> => {
    const response = await fetch(`${API_BASE_URL}/invoices/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error(`Failed to update invoice with id ${id}`);
    }

    return response.json();
  },

  deleteInvoice: async (id: string): Promise<boolean> => {
    const response = await fetch(`${API_BASE_URL}/invoices/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete invoice with id ${id}`);
    }

    return true;
  },

  printInvoice: async (id: string): Promise<Invoice> => {
    // Fix: remove the second parameter that was causing the error
    const response = await fetch(`${API_BASE_URL}/invoices/${id}/print`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to print invoice with id ${id}`);
    }

    return response.json();
  },

  getInvoicesByCustomer: async (customerId: string): Promise<Invoice[]> => {
    try {
      const response = await invoiceService.getAllInvoices({ customer_id: customerId });
      return response?.invoices || [];
    } catch (error) {
      console.error('Error fetching invoices by customer:', error);
      return [];
    }
  },

  getInvoicesByDateRange: async (startDate: string, endDate: string): Promise<Invoice[]> => {
    try {
      const response = await invoiceService.getAllInvoices({ date_from: startDate, date_to: endDate });
      return response?.invoices || [];
    } catch (error) {
      console.error('Error fetching invoices by date range:', error);
      return [];
    }
  },

  getOverdueInvoices: async (): Promise<Invoice[]> => {
    try {
      const response = await invoiceService.getAllInvoices({ status: 'overdue' });
      return response?.invoices || [];
    } catch (error) {
      console.error('Error fetching overdue invoices:', error);
      return [];
    }
  }
};
