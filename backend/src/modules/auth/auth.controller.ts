import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../db/prisma';
import { CONFIG } from '../../config';
import { AuditService } from '../audit/audit.service';
import { AuthenticatedRequest } from '../../middleware/auth';

export class AuthController {
  static async login(req: Request, res: Response) {
    const { username, password, deviceType } = req.body;
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    try {
      const user = await prisma.user.findUnique({
        where: { username: username.trim().toLowerCase() },
      });

      if (!user) {
        await AuditService.record({
          actionType: 'FAILED_LOGIN',
          module: 'AUTH',
          usernameSnapshot: username,
          ipAddress,
          deviceIdentifier: deviceType || 'UNKNOWN_DEVICE',
          reason: 'User not found',
          result: 'FAILURE',
        });
        return res.status(401).json({ error: 'Invalid username or password.' });
      }

      // Check lockout status
      if (user.lockoutUntil && user.lockoutUntil > new Date()) {
        const remainingMinutes = Math.ceil((user.lockoutUntil.getTime() - Date.now()) / (1000 * 60));
        await AuditService.record({
          userId: user.id,
          usernameSnapshot: user.username,
          roleSnapshot: user.role,
          actionType: 'FAILED_LOGIN',
          module: 'AUTH',
          ipAddress,
          deviceIdentifier: deviceType || 'UNKNOWN_DEVICE',
          reason: `Account temporarily locked out. Remaining: ${remainingMinutes}m`,
          result: 'FAILURE',
        });
        return res.status(403).json({
          error: `Account locked due to repeated failed logins. Please retry after ${remainingMinutes} minute(s).`,
        });
      }

      // Check active status
      if (!user.isActive) {
        await AuditService.record({
          userId: user.id,
          usernameSnapshot: user.username,
          roleSnapshot: user.role,
          actionType: 'FAILED_LOGIN',
          module: 'AUTH',
          ipAddress,
          deviceIdentifier: deviceType || 'UNKNOWN_DEVICE',
          reason: 'Account disabled',
          result: 'FAILURE',
        });
        return res.status(403).json({ error: 'Account disabled. Contact system administrator.' });
      }

      // Verify password
      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        const updatedAttempts = user.failedLoginAttempts + 1;
        let lockoutUntil: Date | null = null;
        if (updatedAttempts >= CONFIG.MAX_FAILED_LOGIN_ATTEMPTS) {
          lockoutUntil = new Date(Date.now() + CONFIG.LOCKOUT_DURATION_MINUTES * 60 * 1000);
        }

        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: updatedAttempts,
            lockoutUntil,
          },
        });

        await AuditService.record({
          userId: user.id,
          usernameSnapshot: user.username,
          roleSnapshot: user.role,
          actionType: 'FAILED_LOGIN',
          module: 'AUTH',
          ipAddress,
          deviceIdentifier: deviceType || 'UNKNOWN_DEVICE',
          reason: `Invalid password. Attempt ${updatedAttempts}/${CONFIG.MAX_FAILED_LOGIN_ATTEMPTS}`,
          result: 'FAILURE',
        });

        return res.status(401).json({
          error: lockoutUntil
            ? `Account locked out for ${CONFIG.LOCKOUT_DURATION_MINUTES} minutes due to repeated failures.`
            : 'Invalid username or password.',
        });
      }

      // Successful login -> Reset fail counter
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lockoutUntil: null,
        },
      });

      // Generate JWT
      const token = jwt.sign(
        {
          userId: user.id,
          username: user.username,
          role: user.role,
        },
        CONFIG.JWT_SECRET,
        { expiresIn: '12h' }
      );

      // Record Audit Log
      await AuditService.record({
        userId: user.id,
        usernameSnapshot: user.username,
        roleSnapshot: user.role,
        actionType: 'LOGIN',
        module: 'AUTH',
        ipAddress,
        deviceIdentifier: deviceType || 'UNKNOWN_DEVICE',
        result: 'SUCCESS',
      });

      return res.status(200).json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          role: user.role,
          hasPin: !!user.pinHash,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ error: 'Internal server error during authentication.' });
    }
  }

  static async verifyPin(req: AuthenticatedRequest, res: Response) {
    const { pin } = req.body;
    const userId = req.user?.id;

    if (!userId || !pin) {
      return res.status(400).json({ error: 'PIN is required for confirmation.' });
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { pinHash: true, username: true, role: true },
      });

      if (!user || !user.pinHash) {
        return res.status(400).json({ error: 'User does not have a security PIN configured.' });
      }

      const isValid = await bcrypt.compare(pin, user.pinHash);
      if (!isValid) {
        await AuditService.record({
          userId,
          usernameSnapshot: user.username,
          roleSnapshot: user.role,
          actionType: 'PIN_VERIFICATION_FAILED',
          module: 'AUTH',
          reason: 'Incorrect employee PIN entered',
          result: 'FAILURE',
        });
        return res.status(401).json({ error: 'Incorrect PIN. Verification failed.' });
      }

      return res.status(200).json({ valid: true, message: 'PIN verified successfully.' });
    } catch (error) {
      console.error('PIN verification error:', error);
      return res.status(500).json({ error: 'Failed to verify PIN.' });
    }
  }

  static async logout(req: AuthenticatedRequest, res: Response) {
    if (req.user) {
      await AuditService.record({
        userId: req.user.id,
        usernameSnapshot: req.user.username,
        roleSnapshot: req.user.role,
        actionType: 'LOGOUT',
        module: 'AUTH',
        ipAddress: req.ip || 'unknown',
        result: 'SUCCESS',
      });
    }
    return res.status(200).json({ message: 'Logged out successfully.' });
  }

  static async me(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        phone: true,
        pinHash: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        phone: user.phone,
        hasPin: !!user.pinHash,
      },
    });
  }
}
