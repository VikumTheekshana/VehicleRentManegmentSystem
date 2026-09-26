import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import configuration from './config/configuration';
import { EncryptionService } from './core/encryption/encryption.service';
import { AuditLog, AuditLogSchema } from './core/audit/audit.schema';
import { AuditService } from './core/audit/audit.service';

import { User, UserSchema } from './modules/users/user.schema';
import { Vehicle, VehicleSchema } from './modules/fleet/vehicle.schema';
import { Reservation, ReservationSchema } from './modules/reservations/reservation.schema';
import { Inspection, InspectionSchema } from './modules/inspections/inspection.schema';

import { HealthController } from './modules/health/health.controller';
import { AuthController } from './modules/auth/auth.controller';
import { AuthService } from './modules/auth/auth.service';
import { JwtStrategy } from './modules/auth/strategies/jwt.strategy';

import { FleetController } from './modules/fleet/fleet.controller';
import { FleetService } from './modules/fleet/fleet.service';

import { ReservationsController } from './modules/reservations/reservations.controller';
import { ReservationsService } from './modules/reservations/reservations.service';

import { InspectionsController } from './modules/inspections/inspections.controller';
import { InspectionsService } from './modules/inspections/inspections.service';

import { TelemetryService } from './modules/telemetry/telemetry.service';
import { TelemetryGateway } from './modules/telemetry/telemetry.gateway';

import { BillingController } from './modules/billing/billing.controller';
import { BillingService } from './modules/billing/billing.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ScheduleModule.forRoot(),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('jwtSecret'),
        signOptions: { expiresIn: '15m' },
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('mongoUri'),
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Vehicle.name, schema: VehicleSchema },
      { name: Reservation.name, schema: ReservationSchema },
      { name: Inspection.name, schema: InspectionSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),
  ],
  controllers: [
    HealthController,
    AuthController,
    FleetController,
    ReservationsController,
    InspectionsController,
    BillingController,
  ],
  providers: [
    EncryptionService,
    AuditService,
    JwtStrategy,
    AuthService,
    FleetService,
    ReservationsService,
    InspectionsService,
    TelemetryService,
    TelemetryGateway,
    BillingService,
  ],
})
export class AppModule {}
