
import { getDatabase } from '../database/connection';
import { logger } from './logger';

export interface NotificationData {
  type: 'info' | 'warning' | 'error' | 'success';
  category: 'system' | 'inventory' | 'invoice' | 'user' | 'payment';
  title: string;
  message: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  entityType?: string;
  entityId?: string;
  actionUrl?: string;
  expiresAt?: Date;
}

export const createNotification = async (
  tenantId: string,
  data: NotificationData,
  createdBy?: string
): Promise<void> => {
  try {
    const db = getDatabase();
    
    await db('notifications').insert({
      tenant_id: tenantId,
      type: data.type,
      category: data.category,
      title: data.title,
      message: data.message,
      priority: data.priority || 'medium',
      user_id: data.userId || null,
      entity_type: data.entityType || null,
      entity_id: data.entityId || null,
      action_url: data.actionUrl || null,
      expires_at: data.expiresAt || null,
      created_by: createdBy || null,
      created_at: new Date(),
      updated_at: new Date()
    });

    logger.info(`Notification created: ${data.title}`);
  } catch (error) {
    logger.error('Create notification error:', error);
  }
};

// Predefined notification templates
export const NotificationTemplates = {
  // Inventory notifications
  lowStock: (productName: string, currentStock: number, reorderPoint: number, productId: string) => ({
    type: 'warning' as const,
    category: 'inventory' as const,
    title: 'Low Stock Alert',
    message: `${productName} is running low. Current stock: ${currentStock}, Reorder point: ${reorderPoint}`,
    priority: 'high' as const,
    entityType: 'product',
    entityId: productId,
    actionUrl: `/products/${productId}`
  }),

  outOfStock: (productName: string, productId: string) => ({
    type: 'error' as const,
    category: 'inventory' as const,
    title: 'Out of Stock',
    message: `${productName} is out of stock`,
    priority: 'critical' as const,
    entityType: 'product',
    entityId: productId,
    actionUrl: `/products/${productId}`
  }),

  // Invoice notifications
  invoiceCreated: (invoiceNumber: string, customerName: string, invoiceId: string) => ({
    type: 'success' as const,
    category: 'invoice' as const,
    title: 'Invoice Created',
    message: `Invoice ${invoiceNumber} created for ${customerName}`,
    priority: 'medium' as const,
    entityType: 'invoice',
    entityId: invoiceId,
    actionUrl: `/invoices/${invoiceId}`
  }),

  invoiceOverdue: (invoiceNumber: string, customerName: string, daysOverdue: number, invoiceId: string) => ({
    type: 'warning' as const,
    category: 'invoice' as const,
    title: 'Invoice Overdue',
    message: `Invoice ${invoiceNumber} for ${customerName} is ${daysOverdue} days overdue`,
    priority: 'high' as const,
    entityType: 'invoice',
    entityId: invoiceId,
    actionUrl: `/invoices/${invoiceId}`
  }),

  // Payment notifications
  paymentReceived: (invoiceNumber: string, amount: number, invoiceId: string) => ({
    type: 'success' as const,
    category: 'payment' as const,
    title: 'Payment Received',
    message: `Payment of $${amount} received for invoice ${invoiceNumber}`,
    priority: 'medium' as const,
    entityType: 'invoice',
    entityId: invoiceId,
    actionUrl: `/invoices/${invoiceId}`
  }),

  // User notifications
  userCreated: (userName: string, userRole: string, userId: string) => ({
    type: 'info' as const,
    category: 'user' as const,
    title: 'New User Created',
    message: `New ${userRole} user ${userName} has been created`,
    priority: 'low' as const,
    entityType: 'user',
    entityId: userId,
    actionUrl: `/users/${userId}`
  }),

  // System notifications
  backupCompleted: () => ({
    type: 'success' as const,
    category: 'system' as const,
    title: 'Backup Completed',
    message: 'System backup has been completed successfully',
    priority: 'low' as const
  }),

  systemMaintenance: (scheduledTime: Date) => ({
    type: 'info' as const,
    category: 'system' as const,
    title: 'Scheduled Maintenance',
    message: `System maintenance scheduled for ${scheduledTime.toLocaleString()}`,
    priority: 'medium' as const,
    expiresAt: scheduledTime
  })
};
