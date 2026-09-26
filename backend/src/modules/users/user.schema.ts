import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  FLEET_MANAGER = 'FLEET_MANAGER',
  AGENT = 'AGENT',
  MECHANIC = 'MECHANIC',
  CUSTOMER = 'CUSTOMER',
}

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ type: String, required: true, trim: true })
  fullName: string;

  @Prop({ type: String, required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ type: String, required: true })
  passwordHash: string;

  @Prop({ type: String, required: true, enum: Object.values(UserRole), default: UserRole.CUSTOMER })
  role: UserRole;

  @Prop({ type: String, required: false })
  phoneEncrypted?: string;

  @Prop({ type: String, required: false })
  nicNumberEncrypted?: string;

  @Prop({ type: String, required: false })
  drivingLicenseEncrypted?: string;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: Boolean, default: false })
  isVerified: boolean;

  @Prop({ type: String, default: null })
  refreshTokenHash?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
