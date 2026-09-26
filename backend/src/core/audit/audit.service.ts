import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog, AuditLogDocument } from './audit.schema';

@Injectable()
export class AuditService {
  constructor(
    @InjectModel(AuditLog.name) private auditModel: Model<AuditLogDocument>,
  ) {}

  async log(data: {
    actorId: string;
    actorEmail: string;
    actorRole: string;
    action: string;
    resource: string;
    resourceId?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
  }): Promise<AuditLogDocument> {
    try {
      const record = new this.auditModel(data);
      return await record.save();
    } catch (err) {
      console.error('Failed to persist audit log record:', err);
      // Audit failure must never crash business operations, but should be logged to console
      return null;
    }
  }

  async getRecentLogs(limit = 100): Promise<AuditLogDocument[]> {
    return this.auditModel.find().sort({ createdAt: -1 }).limit(limit).exec();
  }
}
