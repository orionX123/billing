
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  category: 'system' | 'inventory' | 'invoice' | 'user' | 'payment';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  entityType?: string;
  entityId?: string;
  actionUrl?: string;
  isRead: boolean;
  readAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationResponse {
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  unreadCount: number;
}

export interface CreateNotificationData {
  type: 'info' | 'warning' | 'error' | 'success';
  category: 'system' | 'inventory' | 'invoice' | 'user' | 'payment';
  title: string;
  message: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  entityType?: string;
  entityId?: string;
  actionUrl?: string;
  expiresAt?: string;
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

export const notificationService = {
  // Get notifications
  getNotifications: async (params?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
    type?: string;
    category?: string;
    priority?: string;
  }): Promise<NotificationResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.unreadOnly) queryParams.append('unread_only', 'true');
    if (params?.type) queryParams.append('type', params.type);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.priority) queryParams.append('priority', params.priority);

    const response = await fetch(`${API_BASE_URL}/notifications?${queryParams}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch notifications');
    }

    return response.json();
  },

  // Create notification
  createNotification: async (data: CreateNotificationData): Promise<Notification> => {
    const response = await fetch(`${API_BASE_URL}/notifications`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to create notification');
    }

    return response.json();
  },

  // Mark notification as read
  markAsRead: async (id: string): Promise<Notification> => {
    const response = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to mark notification as read');
    }

    return response.json();
  },

  // Mark all notifications as read
  markAllAsRead: async (): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to mark all notifications as read');
    }
  },

  // Delete notification
  deleteNotification: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/notifications/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to delete notification');
    }
  },
};
