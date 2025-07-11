import { createLogger, format, transports } from 'winston';
import { Request } from 'express';
import { storage } from './storage';
import { InsertAuditLog } from '@shared/schema';

// Create a logger instance specifically for audit trail
const auditLogger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(({ timestamp, level, message, ...meta }) => {
          return `[${timestamp}] ${level}: ${message} ${JSON.stringify(meta)}`;
        })
      )
    }),
    new transports.File({ filename: 'logs/audit.log' })
  ],
});

// Define action types for logging
export enum ActionType {
  // Student actions
  STUDENT_CREATED = 'STUDENT_CREATED',
  STUDENT_UPDATED = 'STUDENT_UPDATED',
  STUDENT_DELETED = 'STUDENT_DELETED',
  STUDENT_IMPORTED = 'STUDENT_IMPORTED',
  STUDENT_VIEWED = 'STUDENT_VIEWED',
  
  // School actions
  SCHOOL_CREATED = 'SCHOOL_CREATED',
  SCHOOL_UPDATED = 'SCHOOL_UPDATED',
  SCHOOL_DELETED = 'SCHOOL_DELETED',
  SCHOOL_ACTIVATED = 'SCHOOL_ACTIVATED',
  SCHOOL_DEACTIVATED = 'SCHOOL_DEACTIVATED',
  SCHOOL_VIEWED = 'SCHOOL_VIEWED',
  
  // Registration actions
  REGISTRATION_COMPLETED = 'REGISTRATION_COMPLETED',
  DRAFT_CREATED = 'DRAFT_CREATED',
  DRAFT_UPDATED = 'DRAFT_UPDATED',
  DRAFT_DELETED = 'DRAFT_DELETED',
  
  // Fees actions
  FEES_UPDATED = 'FEES_UPDATED',
  FEES_CREATED = 'FEES_CREATED',
  
  // Resources actions
  RESOURCES_UPDATED = 'RESOURCES_UPDATED',
  RESOURCES_CREATED = 'RESOURCES_CREATED',
  
  // Authentication actions
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  
  // System actions
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  API_REQUEST = 'API_REQUEST'
}

// Interface for audit log entry
interface AuditLogEntry {
  action: ActionType;
  userId?: string;
  username?: string;
  ipAddress?: string;
  userAgent?: string;
  resource?: string;
  resourceId?: string;
  oldData?: any;
  newData?: any;
  details?: string;
  success: boolean;
  errorMessage?: string;
  timestamp?: Date;
  sessionId?: string;
}

class AuditService {
  
  // Log an action with detailed information
  async logAction(entry: AuditLogEntry, req?: Request) {
    const logEntry = {
      ...entry,
      timestamp: new Date(),
      ipAddress: req?.ip || req?.connection?.remoteAddress || 'unknown',
      userAgent: req?.get('User-Agent') || 'unknown',
      sessionId: req?.sessionID || 'unknown'
    };

    // Log to Winston (console/file)
    auditLogger.info('Action logged', logEntry);
    
    // Also persist to database
    try {
      const auditLogData: InsertAuditLog = {
        action: entry.action,
        userId: entry.userId,
        username: entry.username,
        ipAddress: logEntry.ipAddress,
        userAgent: logEntry.userAgent,
        resource: entry.resource,
        resourceId: entry.resourceId,
        oldData: entry.oldData ? JSON.stringify(entry.oldData) : null,
        newData: entry.newData ? JSON.stringify(entry.newData) : null,
        details: entry.details,
        success: entry.success,
        errorMessage: entry.errorMessage,
        sessionId: logEntry.sessionId
      };
      
      await storage.createAuditLog(auditLogData);
    } catch (error) {
      console.error('Failed to persist audit log to database:', error);
    }
  }

  // Log student operations
  async logStudentAction(action: ActionType, studentData: any, req?: Request, oldData?: any) {
    await this.logAction({
      action,
      resource: 'Student',
      resourceId: studentData.studentId || studentData.id,
      newData: studentData,
      oldData,
      success: true,
      details: `Student ${action.toLowerCase()} operation`
    }, req);
  }

  // Log school operations
  async logSchoolAction(action: ActionType, schoolData: any, req?: Request, oldData?: any) {
    await this.logAction({
      action,
      resource: 'School',
      resourceId: schoolData.schoolCode || schoolData.id,
      newData: schoolData,
      oldData,
      success: true,
      details: `School ${action.toLowerCase()} operation`
    }, req);
  }

  // Log authentication actions
  async logAuthAction(action: ActionType, username: string, success: boolean, req?: Request, errorMessage?: string) {
    await this.logAction({
      action,
      username,
      success,
      errorMessage,
      details: `Authentication attempt for user: ${username}`
    }, req);
  }

  // Log API requests
  async logApiRequest(method: string, path: string, statusCode: number, req?: Request, responseTime?: number) {
    await this.logAction({
      action: ActionType.API_REQUEST,
      success: statusCode < 400,
      details: `${method} ${path} - Status: ${statusCode}${responseTime ? ` - Time: ${responseTime}ms` : ''}`,
      newData: {
        method,
        path,
        statusCode,
        responseTime,
        body: req?.body
      }
    }, req);
  }

  // Log system errors
  async logError(error: Error, context: string, req?: Request) {
    await this.logAction({
      action: ActionType.SYSTEM_ERROR,
      success: false,
      errorMessage: error.message,
      details: `System error in ${context}: ${error.message}`,
      newData: {
        stack: error.stack,
        context
      }
    }, req);
  }

  // Log bulk operations
  async logBulkOperation(action: ActionType, count: number, resource: string, req?: Request) {
    await this.logAction({
      action,
      resource,
      success: true,
      details: `Bulk ${action.toLowerCase()} operation: ${count} ${resource}s affected`
    }, req);
  }

  // Get audit logs (for admin viewing)
  async getAuditLogs(filters?: {
    action?: ActionType;
    userId?: string;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }) {
    try {
      // Convert ActionType to string for database query
      const dbFilters = {
        ...filters,
        action: filters?.action ? filters.action.toString() : undefined
      };
      
      return await storage.getAuditLogs(dbFilters);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      throw error;
    }
  }
}

export const auditService = new AuditService();
export default auditLogger;
