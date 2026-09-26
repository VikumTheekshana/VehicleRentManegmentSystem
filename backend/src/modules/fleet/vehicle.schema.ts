import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type VehicleDocument = Vehicle & Document;

export enum VehicleStatus {
  AVAILABLE = 'AVAILABLE',
  RESERVED = 'RESERVED',
  RENTED = 'RENTED',
  MAINTENANCE = 'MAINTENANCE',
  OUT_OF_SERVICE = 'OUT_OF_SERVICE',
}

export enum VehicleCategory {
  SEDAN = 'SEDAN',
  SUV = 'SUV',
  VAN = 'VAN',
  LUXURY = 'LUXURY',
  COMPACT = 'COMPACT',
}

@Schema({ timestamps: true, collection: 'vehicles' })
export class Vehicle {
  @Prop({ type: String, required: true, unique: true, uppercase: true, trim: true })
  vin: string;

  @Prop({ type: String, required: true, unique: true, uppercase: true, trim: true })
  licensePlate: string;

  @Prop({ type: String, required: true, trim: true })
  make: string;

  @Prop({ type: String, required: true, trim: true })
  model: string;

  @Prop({ type: Number, required: true })
  year: number;

  @Prop({ type: String, required: true, enum: Object.values(VehicleCategory), default: VehicleCategory.SEDAN })
  category: VehicleCategory;

  @Prop({ type: String, required: true, default: 'Automatic' })
  transmission: string;

  @Prop({ type: String, required: true, default: 'Petrol' })
  fuelType: string;

  @Prop({ type: Number, required: true, default: 5 })
  seatingCapacity: number;

  @Prop({ type: Number, required: true, default: 0 })
  mileage: number;

  @Prop({ type: Number, required: true, default: 100, min: 0, max: 100 })
  fuelLevelPercentage: number;

  @Prop({ type: Number, required: true })
  dailyRate: number;

  @Prop({ type: Number, required: true })
  securityDeposit: number;

  @Prop({ type: String, required: true, enum: Object.values(VehicleStatus), default: VehicleStatus.AVAILABLE })
  status: VehicleStatus;

  @Prop({ type: Date, required: true })
  insuranceExpiry: Date;

  @Prop({ type: Date, required: true })
  revenueLicenseExpiry: Date;

  @Prop({ type: Boolean, default: false })
  isImmobilized: boolean;

  @Prop({
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      default: [79.8612, 6.9271],
    },
  })
  currentLocation: {
    type: string;
    coordinates: number[];
  };

  @Prop({ type: String, default: '' })
  imageUrl: string;
}

export const VehicleSchema = SchemaFactory.createForClass(Vehicle);
VehicleSchema.index({ currentLocation: '2dsphere' });
VehicleSchema.index({ status: 1, category: 1 });
VehicleSchema.index({ licensePlate: 1 });
