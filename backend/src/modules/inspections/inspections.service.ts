import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Inspection, InspectionDocument, InspectionType } from './inspection.schema';
import { Reservation, ReservationDocument, ReservationStatus } from '../reservations/reservation.schema';
import { Vehicle, VehicleDocument, VehicleStatus } from '../fleet/vehicle.schema';
import { AuditService } from '../../core/audit/audit.service';

@Injectable()
export class InspectionsService {
  constructor(
    @InjectModel(Inspection.name) private inspectionModel: Model<InspectionDocument>,
    @InjectModel(Reservation.name) private reservationModel: Model<ReservationDocument>,
    @InjectModel(Vehicle.name) private vehicleModel: Model<VehicleDocument>,
    private auditService: AuditService,
  ) {}

  async submitInspection(dto: {
    reservationId: string;
    type: InspectionType;
    odometerReading: number;
    fuelLevelPercentage: number;
    damages: any[];
    signatureBase64: string;
    notes?: string;
  }, inspector: any): Promise<InspectionDocument> {
    const reservation = await this.reservationModel.findById(dto.reservationId).populate('vehicle');
    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    const vehicle = await this.vehicleModel.findById(reservation.vehicle);
    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    const inspection = new this.inspectionModel({
      reservation: reservation._id,
      vehicle: vehicle._id,
      inspector: inspector.userId,
      type: dto.type,
      odometerReading: dto.odometerReading,
      fuelLevelPercentage: dto.fuelLevelPercentage,
      damages: dto.damages || [],
      signatureBase64: dto.signatureBase64,
      notes: dto.notes,
    });

    await inspection.save();

    // Update vehicle odometer and fuel
    vehicle.mileage = Math.max(vehicle.mileage, dto.odometerReading);
    vehicle.fuelLevelPercentage = dto.fuelLevelPercentage;

    if (dto.type === InspectionType.CHECK_OUT) {
      reservation.status = ReservationStatus.ACTIVE;
      reservation.inspectionOutId = inspection._id.toString();
      vehicle.status = VehicleStatus.RENTED;
    } else if (dto.type === InspectionType.CHECK_IN) {
      reservation.status = ReservationStatus.COMPLETED;
      reservation.inspectionInId = inspection._id.toString();

      // Check if severe damages require maintenance
      const hasSevereDamage = (dto.damages || []).some((d: any) => d.severity === 'SEVERE');
      vehicle.status = hasSevereDamage ? VehicleStatus.MAINTENANCE : VehicleStatus.AVAILABLE;
    }

    await reservation.save();
    await vehicle.save();

    await this.auditService.log({
      actorId: inspector.userId,
      actorEmail: inspector.email,
      actorRole: inspector.role,
      action: `INSPECTION_${dto.type}_RECORDED`,
      resource: 'Inspection',
      resourceId: inspection._id.toString(),
      metadata: {
        reservationNumber: reservation.reservationNumber,
        plate: vehicle.licensePlate,
        odometer: dto.odometerReading,
        damagesCount: (dto.damages || []).length,
      },
    });

    return inspection;
  }

  async getInspectionsForReservation(reservationId: string): Promise<InspectionDocument[]> {
    return this.inspectionModel.find({ reservation: reservationId }).populate('inspector', 'fullName email').exec();
  }
}
