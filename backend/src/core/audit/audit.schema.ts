import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AuditLogDocument = AuditLog & Document;

@Schema({ timestamps: true, collection: 'audit_logs' })
export class AuditLog {
  @Prop({ type: String, required: true })
  actorId: string;

  @Prop({ type: String, required: true })
  actorEmail: string;

  @Prop({ type: String, required: true })
  actorRole: string;

  @Prop({ type: String, required: true })
  action: string;

  @Prop({ type: String, required: true })
  resource: string;

  @Prop({ type: String, required: false })
  resourceId?: string;

  @Prop({ type: String, required: false })
  ipAddress?: string;

  @Prop({ type: String, required: false })
  userAgent?: string;

  @Prop({ type: Object, required: false })
  metadata?: Record<string, any>;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ actorId: 1, action: 1 });
