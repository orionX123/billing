
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getDatabase } from '../database/connection';
import { logger } from '../utils/logger';

interface JwtPayload {
  userId: string;
  tenantId?: string;
  role: string;
  email: string;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Skip auth for public routes
    const publicRoutes = ['/api/auth/login', '/api/auth/register', '/api/health'];
    if (publicRoutes.includes(req.path)) {
      return next();
    }

    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      res.status(401).json({
        error: 'Access denied',
        message: 'No token provided',
      });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    
    // Verify user still exists and is active
    const db = getDatabase();
    const user = await db('users')
      .where({ id: decoded.userId, is_active: true })
      .first();

    if (!user) {
      res.status(401).json({
        error: 'Access denied',
        message: 'Invalid token',
      });
      return;
    }

    req.user = decoded;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(401).json({
      error: 'Access denied',
      message: 'Invalid token',
    });
  }
};
