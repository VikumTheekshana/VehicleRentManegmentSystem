import { Injectable, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { Reservation, ReservationDocument, ReservationStatus } from './reservation.schema';
import { Vehicle, VehicleDocument, VehicleStatus } from '../fleet/vehicle.schema';
import { AuditService } from '../../core/audit/audit.service';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectModel(Reservation.name) private reservationModel: Model<ReservationDocument>,
    @InjectModel(Vehicle.name) private vehicleModel: Model<VehicleDocument>,
    @InjectConnection() private readonly connection: Connection,
    private auditService: AuditService,
  ) {}

  async createReservation(dto: {
    vehicleId: string;
    pickupDate: string;
    returnDate: string;
    notes?: string;
  }, actor: any): Promise<ReservationDocument> {
    const pickup = new Date(dto.pickupDate);
    const returnDt = new Date(dto.returnDate);

    if (isNaN(pickup.getTime()) || isNaN(returnDt.getTime())) {
      throw new BadRequestException('Invalid pickup or return date format');
    }

    if (pickup >= returnDt) {
      throw new BadRequestException('Return date must be strictly after pickup date');
    }

    const diffTime = Math.abs(returnDt.getTime() - pickup.getTime());
    const totalDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    // Start MongoDB ACID Transaction session for double-booking concurrency safety
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const vehicle = await this.vehicleModel.findById(dto.vehicleId).session(session);
      if (!vehicle) {
        throw new NotFoundException('Vehicle not found');
      }

      if (vehicle.status === VehicleStatus.MAINTENANCE || vehicle.status === VehicleStatus.OUT_OF_SERVICE) {
        throw new ConflictException(`Vehicle is currently unavailable for rent (Status: ${vehicle.status})`);
      }

      // Concurrency check: find any overlapping CONFIRMED or ACTIVE reservations
      const overlappingReservation = await this.reservationModel.findOne({
        vehicle: vehicle._id,
        status: { $in: [ReservationStatus.CONFIRMED, ReservationStatus.ACTIVE] },
        $or: [
          {
            pickupDate: { $lt: returnDt },
            returnDate: { $gt: pickup },
          },
        ],
      }).session(session);

      if (overlappingReservation) {
        throw new ConflictException(
          `Zero-Double-Booking Guard: Vehicle ${vehicle.licensePlate} is already reserved between ${overlappingReservation.pickupDate.toISOString().split('T')[0]} and ${overlappingReservation.returnDate.toISOString().split('T')[0]}`
        );
      }

      const rentalFee = totalDays * vehicle.dailyRate;
      const totalAmount = rentalFee + vehicle.securityDeposit;
      const count = await this.reservationModel.countDocuments();
      const reservationNumber = `RES-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

      const reservation = new this.reservationModel({
        reservationNumber,
        customer: actor.userId,
        vehicle: vehicle._id,
        pickupDate: pickup,
        returnDate: returnDt,
        totalDays,
        dailyRate: vehicle.dailyRate,
        rentalFee,
        securityDeposit: vehicle.securityDeposit,
        totalAmount,
        status: ReservationStatus.CONFIRMED,
        notes: dto.notes,
        isPaid: true,
      });

      await reservation.save({ session });

      await session.commitTransaction();

      await this.auditService.log({
        actorId: actor.userId,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: 'RESERVATION_CREATED',
        resource: 'Reservation',
        resourceId: reservation._id.toString(),
        metadata: {
          reservationNumber,
          vehiclePlate: vehicle.licensePlate,
          pickupDate: pickup.toISOString(),
          returnDate: returnDt.toISOString(),
          totalAmount,
        },
      });

      return reservation;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getAllReservations(actor?: any): Promise<ReservationDocument[]> {
    const query: any = {};
    if (actor && actor.role === 'CUSTOMER') {
      query.customer = actor.userId;
    }
    return this.reservationModel
      .find(query)
      .populate('vehicle', 'make model licensePlate category dailyRate imageUrl')
      .populate('customer', 'fullName email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async getReservationById(id: string): Promise<ReservationDocument> {
    const reservation = await this.reservationModel
      .findById(id)
      .populate('vehicle')
      .populate('customer', 'fullName email')
      .exec();
    if (!reservation) {
      throw new NotFoundException(`Reservation ${id} not found`);
    }
    return reservation;
  }

  async cancelReservation(id: string, actor: any): Promise<ReservationDocument> {
    const reservation = await this.getReservationById(id);
    if (reservation.status === ReservationStatus.COMPLETED || reservation.status === ReservationStatus.ACTIVE) {
      throw new BadRequestException(`Cannot cancel reservation with status ${reservation.status}`);
    }

    reservation.status = ReservationStatus.CANCELLED;
    await reservation.save();

    await this.auditService.log({
      actorId: actor.userId,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'RESERVATION_CANCELLED',
      resource: 'Reservation',
      resourceId: reservation._id.toString(),
    });

    return reservation;
  }
}
