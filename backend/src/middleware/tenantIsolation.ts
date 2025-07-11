
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import { getDatabase } from '../database/connection';

export const tenantIsolation = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'User not authenticated',
      });
      return;
    }

    // Super admins can access all tenants
    if (user.role === 'superadmin') {
      next();
      return;
    }

    // All other users must have a tenant
    if (!user.tenantId) {
      res.status(403).json({
        error: 'Access denied',
        message: 'No tenant association found',
      });
      return;
    }

    // Verify tenant is active
    const db = getDatabase();
    const tenant = await db('tenants')
      .where({ id: user.tenantId, status: 'active' })
      .first();

    if (!tenant) {
      res.status(403).json({
        error: 'Access denied',
        message: 'Tenant not found or inactive',
      });
      return;
    }

    // Add tenant filter to query context
    req.tenantId = user.tenantId;
    next();
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to verify tenant access',
    });
  }
};

// Extend Request interface
declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
    }
  }
}
