import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Vehicle, VehicleDocument } from '../fleet/vehicle.schema';

export interface TelemetryPacket {
  vehicleId: string;
  plate: string;
  make: string;
  model: string;
  speed: number; // km/h
  fuelPercentage: number;
  batteryVoltage: number;
  engineStatus: 'RUNNING' | 'IDLE' | 'STOPPED';
  isImmobilized: boolean;
  latitude: number;
  longitude: number;
  geofenceStatus: 'SAFE' | 'BREACH';
  timestamp: string;
}

@Injectable()
export class TelemetryService {
  // Colombo World Trade Center central reference coordinate
  private readonly centerLat = 6.9344;
  private readonly centerLng = 79.8428;
  private readonly geofenceRadiusKm = 25; // 25km safe perimeter

  constructor(@InjectModel(Vehicle.name) private vehicleModel: Model<VehicleDocument>) {}

  async generateMockTelemetry(): Promise<TelemetryPacket[]> {
    const vehicles = await this.vehicleModel.find({ status: { $ne: 'OUT_OF_SERVICE' } }).limit(10).exec();
    const now = new Date().toISOString();

    return vehicles.map((v, index) => {
      // Small simulated coordinate variance
      const jitterLat = (Math.sin(Date.now() / 10000 + index) * 0.04);
      const jitterLng = (Math.cos(Date.now() / 10000 + index) * 0.04);

      const lat = (v.currentLocation?.coordinates?.[1] || this.centerLat) + jitterLat;
      const lng = (v.currentLocation?.coordinates?.[0] || this.centerLng) + jitterLng;

      const distFromCenter = this.calculateDistanceKm(this.centerLat, this.centerLng, lat, lng);
      const isBreached = distFromCenter > this.geofenceRadiusKm;

      const speed = v.isImmobilized ? 0 : Math.floor(Math.abs(Math.sin(Date.now() / 5000 + index)) * 85);
      const engineStatus = v.isImmobilized ? 'STOPPED' : speed > 0 ? 'RUNNING' : 'IDLE';

      return {
        vehicleId: v._id.toString(),
        plate: v.licensePlate,
        make: v.make,
        model: v.model,
        speed,
        fuelPercentage: Math.max(10, v.fuelLevelPercentage - (index % 5)),
        batteryVoltage: v.isImmobilized ? 11.8 : 13.6,
        engineStatus,
        isImmobilized: v.isImmobilized,
        latitude: lat,
        longitude: lng,
        geofenceStatus: isBreached ? 'BREACH' : 'SAFE',
        timestamp: now,
      };
    });
  }

  private calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
