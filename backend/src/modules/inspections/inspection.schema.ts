import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';
import { Reservation } from '../reservations/reservation.schema';
import { Vehicle } from '../fleet/vehicle.schema';
import { User } from '../users/user.schema';

export type InspectionDocument = Inspection & Document;

export enum InspectionType {
  CHECK_OUT = 'CHECK_OUT',
  CHECK_IN = 'CHECK_IN',
}

@Schema({ timestamps: true, collection: 'inspections' })
export class Inspection {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: Reservation.name, required: true })
  reservation: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: Vehicle.name, required: true })
  vehicle: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: User.name, required: true })
  inspector: Types.ObjectId;

  @Prop({ type: String, required: true, enum: Object.values(InspectionType) })
  type: InspectionType;

  @Prop({ type: Number, required: true })
  odometerReading: number;

  @Prop({ type: Number, required: true, min: 0, max: 100 })
  fuelLevelPercentage: number;

  @Prop({ type: Array, default: [] })
  damages: any[];

  @Prop({ type: String, required: true })
  signatureBase64: string;

  @Prop({ type: [String], default: [] })
  photos: string[];

  @Prop({ type: String })
  notes?: string;
}

export const InspectionSchema = SchemaFactory.createForClass(Inspection);
InspectionSchema.index({ reservation: 1, type: 1 });
InspectionSchema.index({ vehicle: 1 });
