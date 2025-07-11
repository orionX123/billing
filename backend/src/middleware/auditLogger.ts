
import { Request, Response, NextFunction } from 'express';
import { getDatabase } from '../database/connection';
import { AuthenticatedRequest } from './auth';

interface AuditLogData {
  action: string;
  entityType: string;
  entityId?: string;
  oldValues?: any;
  newValues?: any;
}

export const createAuditLog = async (
  req: AuthenticatedRequest,
  data: AuditLogData
): Promise<void> => {
  try {
    const db = getDatabase();
    
    await db('audit_logs').insert({
      tenant_id: req.tenantId || null,
      user_id: req.user?.userId || null,
      action: data.action,
      entity_type: data.entityType,
      entity_id: data.entityId || null,
      old_values: data.oldValues ? JSON.stringify(data.oldValues) : null,
      new_values: data.newValues ? JSON.stringify(data.newValues) : null,
      ip_address: req.ip,
      user_agent: req.get('User-Agent') || null,
      created_at: new Date(),
      updated_at: new Date()
    });
  } catch (error) {
    console.error('Audit logging error:', error);
    // Don't throw error to avoid breaking the main request
  }
};

export const auditLogger = (action: string, entityType: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const originalJson = res.json;
    
    res.json = function(body: any) {
      // Log successful operations
      if (res.statusCode >= 200 && res.statusCode < 300) {
        createAuditLog(req, {
          action,
          entityType,
          entityId: body?.id || req.params?.id,
          newValues: body
        });
      }
      
      return originalJson.call(this, body);
    };
    
    next();
  };
};
