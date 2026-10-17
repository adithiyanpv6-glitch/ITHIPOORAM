import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { CONFIG } from '../config';
import { prisma } from '../db/prisma';

export interface AuthenticatedUser {
  id: string;
  username: string;
  fullName: string;
  role: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

/**
 * Verifies JWT token and checks if employee account is still active in database
 */
export async function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. No token provided.' });
  }

  try {
    const payload = jwt.verify(token, CONFIG.JWT_SECRET) as {
      userId: string;
      username: string;
      role: string;
    };

    // Verify user exists and is active (handles instant deactivation)
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, username: true, fullName: true, role: true, isActive: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'User account does not exist.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Your account has been disabled by an administrator.' });
    }

    req.user = {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired session token.' });
  }
}

/**
 * Enforces role-based permissions
 */
export function requireRoles(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Role '${req.user.role}' is not authorized for this action. Required: ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
}

/**
 * Validates employee PIN for sensitive counter/manager operations
 */
export async function verifyEmployeePin(userId: string, plainPin: string): Promise<boolean> {
  if (!plainPin || plainPin.trim().length === 0) return false;
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { pinHash: true },
  });

  if (!user || !user.pinHash) return false;
  return bcrypt.compare(plainPin, user.pinHash);
}
