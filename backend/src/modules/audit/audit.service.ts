import { prisma } from '../../db/prisma';

export interface CreateAuditLogParams {
  userId?: string | null;
  usernameSnapshot?: string | null;
  roleSnapshot?: string | null;
  deviceIdentifier?: string | null;
  ipAddress?: string | null;
  actionType: string;
  module: string;
  entityType?: string | null;
  entityId?: string | null;
  tableCode?: string | null;
  orderCode?: string | null;
  invoiceNumber?: string | null;
  beforeSnapshot?: Record<string, any> | null;
  afterSnapshot?: Record<string, any> | null;
  reason?: string | null;
  result?: 'SUCCESS' | 'FAILURE';
}

export class AuditService {
  /**
   * Appends an immutable audit log record to the database
   */
  static async record(params: CreateAuditLogParams) {
    try {
      const log = await prisma.auditLog.create({
        data: {
          userId: params.userId || null,
          usernameSnapshot: params.usernameSnapshot || null,
          roleSnapshot: params.roleSnapshot || null,
          deviceIdentifier: params.deviceIdentifier || null,
          ipAddress: params.ipAddress || null,
          actionType: params.actionType,
          module: params.module,
          entityType: params.entityType || null,
          entityId: params.entityId || null,
          tableCode: params.tableCode || null,
          orderCode: params.orderCode || null,
          invoiceNumber: params.invoiceNumber || null,
          beforeSnapshot: params.beforeSnapshot ? JSON.stringify(params.beforeSnapshot) : null,
          afterSnapshot: params.afterSnapshot ? JSON.stringify(params.afterSnapshot) : null,
          reason: params.reason || null,
          result: params.result || 'SUCCESS',
        },
      });
      return log;
    } catch (error) {
      console.error('CRITICAL: Failed to write audit log:', error);
      // We don't throw to avoid killing primary flow, but it is logged to standard error
      return null;
    }
  }

  /**
   * Fetches audit logs with filtering and pagination
   */
  static async queryLogs(filters: {
    module?: string;
    actionType?: string;
    tableCode?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};
    if (filters.module) where.module = filters.module;
    if (filters.actionType) where.actionType = filters.actionType;
    if (filters.tableCode) where.tableCode = filters.tableCode;
    if (filters.userId) where.userId = filters.userId;
    if (filters.startDate || filters.endDate) {
      where.timestamp = {};
      if (filters.startDate) where.timestamp.gte = new Date(filters.startDate);
      if (filters.endDate) where.timestamp.lte = new Date(filters.endDate);
    }

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: filters.limit || 50,
        skip: filters.offset || 0,
      }),
    ]);

    return { total, logs };
  }
}
