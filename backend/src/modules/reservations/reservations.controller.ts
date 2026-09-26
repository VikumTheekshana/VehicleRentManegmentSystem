import { Controller, Get, Post, Param, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReservationsService } from './reservations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Atomic Reservations')
@Controller('reservations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get reservations list (filtered by user role)' })
  async getReservations(@Req() req: any) {
    return this.reservationsService.getAllReservations(req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get reservation details by ID' })
  async getReservation(@Param('id') id: string) {
    return this.reservationsService.getReservationById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new atomic reservation with concurrency protection' })
  async createReservation(@Body() dto: any, @Req() req: any) {
    return this.reservationsService.createReservation(dto, req.user);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a pending or confirmed reservation' })
  async cancelReservation(@Param('id') id: string, @Req() req: any) {
    return this.reservationsService.cancelReservation(id, req.user);
  }
}
