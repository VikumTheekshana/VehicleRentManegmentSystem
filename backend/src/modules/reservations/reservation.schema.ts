import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';
import { User } from '../users/user.schema';
import { Vehicle } from '../fleet/vehicle.schema';

export type ReservationDocument = Reservation & Document;

export enum ReservationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Schema({ timestamps: true, collection: 'reservations' })
export class Reservation {
  @Prop({ type: String, required: true, unique: true, uppercase: true })
  reservationNumber: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: User.name, required: true })
  customer: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: Vehicle.name, required: true })
  vehicle: Types.ObjectId;

  @Prop({ type: Date, required: true })
  pickupDate: Date;

  @Prop({ type: Date, required: true })
  returnDate: Date;

  @Prop({ type: Number, required: true, min: 1 })
  totalDays: number;

  @Prop({ type: Number, required: true })
  dailyRate: number;

  @Prop({ type: Number, required: true })
  rentalFee: number;

  @Prop({ type: Number, required: true })
  securityDeposit: number;

  @Prop({ type: Number, required: true })
  totalAmount: number;

  @Prop({ type: String, required: true, enum: Object.values(ReservationStatus), default: ReservationStatus.CONFIRMED })
  status: ReservationStatus;

  @Prop({ type: Boolean, default: false })
  isPaid: boolean;

  @Prop({ type: String, default: null })
  inspectionOutId?: string;

  @Prop({ type: String, default: null })
  inspectionInId?: string;

  @Prop({ type: String })
  notes?: string;
}

export const ReservationSchema = SchemaFactory.createForClass(Reservation);
ReservationSchema.index({ vehicle: 1, pickupDate: 1, returnDate: 1 });
ReservationSchema.index({ customer: 1, status: 1 });
ReservationSchema.index({ reservationNumber: 1 });
