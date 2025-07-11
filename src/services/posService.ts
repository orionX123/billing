export interface POSItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  barcode?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  discountType: 'amount' | 'percentage';
  vatRate: number;
  totalAmount: number;
  category: string;
}

export interface POSTransaction {
  id: string;
  transactionNumber: string;
  tenantId: string;
  locationId: string;
  cashierId: string;
  cashierName: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  items: POSItem[];
  subtotal: number;
  totalDiscount: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: 'cash' | 'card' | 'mobile' | 'credit' | 'mixed';
  paymentDetails: {
    cash?: number;
    card?: number;
    mobile?: number;
    change?: number;
  };
  status: 'completed' | 'pending' | 'cancelled' | 'refunded';
  timestamp: string;
  receiptPrinted: boolean;
  notes?: string;
  refundReason?: string;
  originalTransactionId?: string;
}

export interface POSSession {
  id: string;
  tenantId: string;
  locationId: string;
  cashierId: string;
  cashierName: string;
  startTime: string;
  endTime?: string;
  startingCash: number;
  endingCash?: number;
  totalSales: number;
  totalTransactions: number;
  status: 'active' | 'closed';
  transactions: string[];
}

const POS_TRANSACTIONS_KEY = 'pos_transactions';
const POS_SESSIONS_KEY = 'pos_sessions';

export const posService = {
  // Transaction Management
  getAllTransactions: (tenantId: string): POSTransaction[] => {
    const stored = localStorage.getItem(POS_TRANSACTIONS_KEY);
    const allTransactions = stored ? JSON.parse(stored) : [];
    return allTransactions.filter((t: POSTransaction) => t.tenantId === tenantId);
  },

  createTransaction: (transactionData: Omit<POSTransaction, 'id' | 'transactionNumber' | 'timestamp'>): POSTransaction => {
    const stored = localStorage.getItem(POS_TRANSACTIONS_KEY);
    const allTransactions = stored ? JSON.parse(stored) : [];
    
    const todayTransactions = allTransactions.filter((t: POSTransaction) => 
      t.tenantId === transactionData.tenantId && 
      t.timestamp.startsWith(new Date().toISOString().split('T')[0])
    );
    
    const newTransaction: POSTransaction = {
      ...transactionData,
      id: `TXN-${Date.now()}`,
      transactionNumber: `TXN-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${String(todayTransactions.length + 1).padStart(4, '0')}`,
      timestamp: new Date().toISOString()
    };
    
    allTransactions.push(newTransaction);
    localStorage.setItem(POS_TRANSACTIONS_KEY, JSON.stringify(allTransactions));
    return newTransaction;
  },

  updateTransaction: (id: string, updates: Partial<POSTransaction>): POSTransaction | null => {
    const stored = localStorage.getItem(POS_TRANSACTIONS_KEY);
    const allTransactions = stored ? JSON.parse(stored) : [];
    const index = allTransactions.findIndex((t: POSTransaction) => t.id === id);
    
    if (index === -1) return null;
    
    allTransactions[index] = { ...allTransactions[index], ...updates };
    localStorage.setItem(POS_TRANSACTIONS_KEY, JSON.stringify(allTransactions));
    return allTransactions[index];
  },

  refundTransaction: (id: string, reason: string, refundedBy: string): POSTransaction | null => {
    const transaction = posService.getTransactionById(id);
    if (!transaction) return null;

    // Create refund transaction
    const refundTransaction: POSTransaction = {
      ...transaction,
      id: `REF-${Date.now()}`,
      transactionNumber: `REF-${transaction.transactionNumber}`,
      totalAmount: -transaction.totalAmount,
      status: 'refunded',
      refundReason: reason,
      originalTransactionId: id,
      timestamp: new Date().toISOString(),
      items: transaction.items.map(item => ({
        ...item,
        quantity: -item.quantity,
        totalAmount: -item.totalAmount
      }))
    };

    const stored = localStorage.getItem(POS_TRANSACTIONS_KEY);
    const allTransactions = stored ? JSON.parse(stored) : [];
    allTransactions.push(refundTransaction);
    localStorage.setItem(POS_TRANSACTIONS_KEY, JSON.stringify(allTransactions));

    return refundTransaction;
  },

  getTransactionById: (id: string): POSTransaction | null => {
    const stored = localStorage.getItem(POS_TRANSACTIONS_KEY);
    const allTransactions = stored ? JSON.parse(stored) : [];
    return allTransactions.find((t: POSTransaction) => t.id === id) || null;
  },

  // Session Management
  startSession: (sessionData: Omit<POSSession, 'id' | 'startTime' | 'status' | 'transactions' | 'totalSales' | 'totalTransactions'>): POSSession => {
    const stored = localStorage.getItem(POS_SESSIONS_KEY);
    const allSessions = stored ? JSON.parse(stored) : [];
    
    const newSession: POSSession = {
      ...sessionData,
      id: `SES-${Date.now()}`,
      startTime: new Date().toISOString(),
      status: 'active',
      transactions: [],
      totalSales: 0,
      totalTransactions: 0
    };
    
    allSessions.push(newSession);
    localStorage.setItem(POS_SESSIONS_KEY, JSON.stringify(allSessions));
    return newSession;
  },

  endSession: (sessionId: string, endingCash: number): POSSession | null => {
    const stored = localStorage.getItem(POS_SESSIONS_KEY);
    const allSessions = stored ? JSON.parse(stored) : [];
    const index = allSessions.findIndex((s: POSSession) => s.id === sessionId);
    
    if (index === -1) return null;
    
    allSessions[index] = {
      ...allSessions[index],
      endTime: new Date().toISOString(),
      endingCash,
      status: 'closed'
    };
    
    localStorage.setItem(POS_SESSIONS_KEY, JSON.stringify(allSessions));
    return allSessions[index];
  },

  getActiveSession: (tenantId: string, locationId: string, cashierId: string): POSSession | null => {
    const stored = localStorage.getItem(POS_SESSIONS_KEY);
    const allSessions = stored ? JSON.parse(stored) : [];
    return allSessions.find((s: POSSession) => 
      s.tenantId === tenantId && 
      s.locationId === locationId && 
      s.cashierId === cashierId && 
      s.status === 'active'
    ) || null;
  },

  // Analytics
  getDailySales: (tenantId: string, date: string): { total: number; transactions: number } => {
    const transactions = posService.getAllTransactions(tenantId);
    const dailyTransactions = transactions.filter(t => 
      t.timestamp.startsWith(date) && t.status === 'completed'
    );
    
    return {
      total: dailyTransactions.reduce((sum, t) => sum + t.totalAmount, 0),
      transactions: dailyTransactions.length
    };
  },

  getTopProducts: (tenantId: string, days: number = 7): Array<{productId: string; productName: string; quantity: number; revenue: number}> => {
    const transactions = posService.getAllTransactions(tenantId);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const recentTransactions = transactions.filter(t => 
      new Date(t.timestamp) >= cutoffDate && t.status === 'completed'
    );
    
    const productStats: Record<string, {productName: string; quantity: number; revenue: number}> = {};
    
    recentTransactions.forEach(transaction => {
      transaction.items.forEach(item => {
        if (!productStats[item.productId]) {
          productStats[item.productId] = {
            productName: item.productName,
            quantity: 0,
            revenue: 0
          };
        }
        productStats[item.productId].quantity += item.quantity;
        productStats[item.productId].revenue += item.totalAmount;
      });
    });
    
    return Object.entries(productStats)
      .map(([productId, stats]) => ({ productId, ...stats }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }
};