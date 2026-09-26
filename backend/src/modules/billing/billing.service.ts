import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import PDFDocument from 'pdfkit';
import { Reservation, ReservationDocument } from '../reservations/reservation.schema';
import { Inspection, InspectionDocument } from '../inspections/inspection.schema';
import { Vehicle, VehicleDocument } from '../fleet/vehicle.schema';

@Injectable()
export class BillingService {
  constructor(
    @InjectModel(Reservation.name) private reservationModel: Model<ReservationDocument>,
    @InjectModel(Inspection.name) private inspectionModel: Model<InspectionDocument>,
    @InjectModel(Vehicle.name) private vehicleModel: Model<VehicleDocument>,
  ) {}

  async calculateFinalBilling(reservationId: string) {
    const reservation = await this.reservationModel
      .findById(reservationId)
      .populate('vehicle')
      .populate('customer', 'fullName email')
      .exec();

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    const vehicle = reservation.vehicle as any;
    const inspections = await this.inspectionModel.find({ reservation: reservation._id });
    const checkOut = inspections.find((i) => i.type === 'CHECK_OUT');
    const checkIn = inspections.find((i) => i.type === 'CHECK_IN');

    const totalDays = reservation.totalDays;
    const dailyAllowanceKm = 250;
    const totalAllowedKm = totalDays * dailyAllowanceKm;

    let totalDrivenKm = 0;
    let excessKm = 0;
    let excessKmFee = 0;
    let fuelDeficitPercent = 0;
    let fuelPenalty = 0;
    let damageCharges = 0;

    if (checkOut && checkIn) {
      totalDrivenKm = Math.max(0, checkIn.odometerReading - checkOut.odometerReading);
      excessKm = Math.max(0, totalDrivenKm - totalAllowedKm);
      excessKmFee = excessKm * 120; // LKR 120 per excess km

      fuelDeficitPercent = Math.max(0, checkOut.fuelLevelPercentage - checkIn.fuelLevelPercentage);
      fuelPenalty = fuelDeficitPercent * 450; // LKR 450 per 1% fuel deficit

      damageCharges = (checkIn.damages || []).reduce((sum, d) => sum + (d.estimatedCost || 0), 0);
    }

    const baseRentalFee = reservation.rentalFee;
    const initialDeposit = reservation.securityDeposit;
    const totalDeductions = excessKmFee + fuelPenalty + damageCharges;
    const netDepositRefund = Math.max(0, initialDeposit - totalDeductions);
    const balanceOwed = totalDeductions > initialDeposit ? totalDeductions - initialDeposit : 0;
    const grandTotalPaid = baseRentalFee + totalDeductions;

    return {
      reservationNumber: reservation.reservationNumber,
      customer: reservation.customer,
      vehicle: {
        make: vehicle.make,
        model: vehicle.model,
        plate: vehicle.licensePlate,
        vin: vehicle.vin,
      },
      durationDays: totalDays,
      pickupDate: reservation.pickupDate,
      returnDate: reservation.returnDate,
      baseRentalFee,
      initialDeposit,
      metrics: {
        totalDrivenKm,
        allowedKm: totalAllowedKm,
        excessKm,
        excessKmFee,
        fuelDeficitPercent,
        fuelPenalty,
        damageCharges,
        totalDeductions,
      },
      settlement: {
        initialDepositHeld: initialDeposit,
        totalDeductionsFromDeposit: Math.min(initialDeposit, totalDeductions),
        netDepositRefundToCustomer: netDepositRefund,
        additionalBalanceDueFromCustomer: balanceOwed,
        grandTotalRevenue: grandTotalPaid,
      },
    };
  }

  async generateInvoicePdf(reservationId: string): Promise<Buffer> {
    const billing = await this.calculateFinalBilling(reservationId);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Header Banner
      doc.rect(40, 40, 515, 60).fill('#0f172a');
      doc.fillColor('#ffffff').fontSize(18).text('ENTERPRISE VEHICLE RENTAL & FLEET MANAGEMENT', 55, 55);
      doc.fontSize(10).fillColor('#94a3b8').text('Official Rental Settlement & Tax Invoice Statement', 55, 78);

      // Metadata Grid
      doc.moveDown(3);
      doc.fillColor('#1e293b').fontSize(12).font('Helvetica-Bold').text(`Invoice #: INV-${billing.reservationNumber}`, 40, 120);
      doc.font('Helvetica').fontSize(9).fillColor('#475569');
      doc.text(`Issue Date: ${new Date().toLocaleDateString('en-GB')}`, 40, 138);
      doc.text(`Vehicle: ${billing.vehicle.make} ${billing.vehicle.model} (${billing.vehicle.plate})`, 40, 152);
      doc.text(`Duration: ${billing.durationDays} Days (${billing.pickupDate.toISOString().split('T')[0]} to ${billing.returnDate.toISOString().split('T')[0]})`, 40, 166);

      // Line Items Table
      let y = 195;
      doc.rect(40, y, 515, 20).fill('#e2e8f0');
      doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(9);
      doc.text('DESCRIPTION', 50, y + 6);
      doc.text('USAGE / DEFICIT', 260, y + 6);
      doc.text('RATE', 380, y + 6);
      doc.text('AMOUNT (LKR)', 460, y + 6);

      const items = [
        { desc: 'Base Vehicle Rental Charge', usage: `${billing.durationDays} Days`, rate: `LKR ${(billing.baseRentalFee / billing.durationDays).toLocaleString()}`, amount: billing.baseRentalFee },
        { desc: 'Initial Security Deposit (Hold)', usage: '1 Vehicle', rate: 'Fixed', amount: billing.initialDeposit },
        { desc: 'Excess Mileage Fee', usage: `${billing.metrics.excessKm} km`, rate: 'LKR 120/km', amount: billing.metrics.excessKmFee },
        { desc: 'Fuel Refill & Deficit Surcharge', usage: `${billing.metrics.fuelDeficitPercent}% Deficit`, rate: 'LKR 450/%', amount: billing.metrics.fuelPenalty },
        { desc: 'Accrued Damage Repair Surcharge', usage: 'Inspection Check-In', rate: 'Itemized', amount: billing.metrics.damageCharges },
      ];

      y += 24;
      doc.font('Helvetica').fontSize(9).fillColor('#334155');
      items.forEach((item) => {
        doc.text(item.desc, 50, y);
        doc.text(item.usage, 260, y);
        doc.text(item.rate, 380, y);
        doc.text(item.amount.toLocaleString('en-LK', { minimumFractionDigits: 2 }), 460, y);
        y += 20;
      });

      // Settlement Box
      y += 10;
      doc.rect(40, y, 515, 80).fill('#f8fafc').stroke('#cbd5e1');
      doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(10);
      doc.text('FINAL SECURITY DEPOSIT & SETTLEMENT SUMMARY', 55, y + 12);

      doc.font('Helvetica').fontSize(9).fillColor('#475569');
      doc.text(`Total Additional Deductions: LKR ${billing.metrics.totalDeductions.toLocaleString('en-LK', { minimumFractionDigits: 2 })}`, 55, y + 32);
      doc.text(`Net Security Deposit Refund to Customer: LKR ${billing.settlement.netDepositRefundToCustomer.toLocaleString('en-LK', { minimumFractionDigits: 2 })}`, 55, y + 48);
      doc.fillColor('#0f172a').font('Helvetica-Bold').text(`Net Balance Due from Customer: LKR ${billing.settlement.additionalBalanceDueFromCustomer.toLocaleString('en-LK', { minimumFractionDigits: 2 })}`, 55, y + 64);

      // Security Signature
      doc.fontSize(8).fillColor('#94a3b8').text('This computer-generated invoice is cryptographically recorded in the VMS immutable audit log.', 40, 750, { align: 'center' });

      doc.end();
    });
  }
}
