import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Vehicle, VehicleDocument, VehicleStatus } from './vehicle.schema';
import { AuditService } from '../../core/audit/audit.service';

@Injectable()
export class FleetService {
  constructor(
    @InjectModel(Vehicle.name) private vehicleModel: Model<VehicleDocument>,
    private auditService: AuditService,
  ) {}

  async createVehicle(dto: any, actor: any): Promise<VehicleDocument> {
    const existing = await this.vehicleModel.findOne({
      $or: [{ vin: dto.vin.toUpperCase() }, { licensePlate: dto.licensePlate.toUpperCase() }],
    });
    if (existing) {
      throw new ConflictException('A vehicle with this VIN or License Plate already exists');
    }

    const vehicle = new this.vehicleModel({
      ...dto,
      vin: dto.vin.toUpperCase(),
      licensePlate: dto.licensePlate.toUpperCase(),
      currentLocation: dto.currentLocation || { type: 'Point', coordinates: [79.8612, 6.9271] },
    });

    await vehicle.save();

    await this.auditService.log({
      actorId: actor.userId,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'VEHICLE_CREATED',
      resource: 'Vehicle',
      resourceId: vehicle._id.toString(),
      metadata: { plate: vehicle.licensePlate, make: vehicle.make, model: vehicle.model },
    });

    return vehicle;
  }

  async getAllVehicles(filters?: { category?: string; status?: string; search?: string }): Promise<VehicleDocument[]> {
    const query: any = {};
    if (filters?.category) query.category = filters.category;
    if (filters?.status) query.status = filters.status;
    if (filters?.search) {
      query.$or = [
        { make: new RegExp(filters.search, 'i') },
        { model: new RegExp(filters.search, 'i') },
        { licensePlate: new RegExp(filters.search, 'i') },
      ];
    }
    return this.vehicleModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async getVehicleById(id: string): Promise<VehicleDocument> {
    const vehicle = await this.vehicleModel.findById(id).exec();
    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    }
    return vehicle;
  }

  async updateStatus(id: string, status: VehicleStatus, actor: any): Promise<VehicleDocument> {
    const vehicle = await this.getVehicleById(id);
    const prevStatus = vehicle.status;
    vehicle.status = status;
    await vehicle.save();

    await this.auditService.log({
      actorId: actor.userId,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'VEHICLE_STATUS_UPDATED',
      resource: 'Vehicle',
      resourceId: vehicle._id.toString(),
      metadata: { from: prevStatus, to: status, plate: vehicle.licensePlate },
    });

    return vehicle;
  }

  async toggleImmobilizer(id: string, shouldImmobilize: boolean, actor: any): Promise<VehicleDocument> {
    const vehicle = await this.getVehicleById(id);
    vehicle.isImmobilized = shouldImmobilize;
    await vehicle.save();

    await this.auditService.log({
      actorId: actor.userId,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: shouldImmobilize ? 'ENGINE_IMMOBILIZED' : 'ENGINE_MOBILIZED',
      resource: 'Vehicle',
      resourceId: vehicle._id.toString(),
      metadata: { plate: vehicle.licensePlate, immobilized: shouldImmobilize },
    });

    return vehicle;
  }

  async checkExpiringDocuments(thresholdDays = 30) {
    const now = new Date();
    const thresholdDate = new Date();
    thresholdDate.setDate(now.getDate() + thresholdDays);

    const expiringInsurance = await this.vehicleModel.find({
      insuranceExpiry: { $lte: thresholdDate, $gte: now },
    });

    const expiringRevenue = await this.vehicleModel.find({
      revenueLicenseExpiry: { $lte: thresholdDate, $gte: now },
    });

    return {
      thresholdDays,
      expiringInsuranceCount: expiringInsurance.length,
      expiringRevenueCount: expiringRevenue.length,
      expiringInsurance: expiringInsurance.map((v) => ({
        id: v._id,
        plate: v.licensePlate,
        make: v.make,
        model: v.model,
        expiry: v.insuranceExpiry,
      })),
      expiringRevenue: expiringRevenue.map((v) => ({
        id: v._id,
        plate: v.licensePlate,
        make: v.make,
        model: v.model,
        expiry: v.revenueLicenseExpiry,
      })),
    };
  }
}
