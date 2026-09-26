import { Controller, Get, Post, Patch, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FleetService } from './fleet.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user.schema';
import { VehicleStatus } from './vehicle.schema';

@ApiTags('Fleet Management')
@Controller('fleet')
export class FleetController {
  constructor(private readonly fleetService: FleetService) {}

  @Get()
  @ApiOperation({ summary: 'List all vehicles with optional filters' })
  async getVehicles(@Query('category') category?: string, @Query('status') status?: string, @Query('search') search?: string) {
    return this.fleetService.getAllVehicles({ category, status, search });
  }

  @Get('document-expiries')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.FLEET_MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List vehicles with expiring insurance or revenue licenses' })
  async getDocumentExpiries(@Query('days') days?: number) {
    return this.fleetService.checkExpiringDocuments(days ? parseInt(days as any, 10) : 30);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get vehicle specifications by ID' })
  async getVehicle(@Param('id') id: string) {
    return this.fleetService.getVehicleById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.FLEET_MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register a new vehicle in the fleet' })
  async createVehicle(@Body() dto: any, @Req() req: any) {
    return this.fleetService.createVehicle(dto, req.user);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.FLEET_MANAGER, UserRole.MECHANIC)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update vehicle lifecycle or maintenance status' })
  async updateStatus(@Param('id') id: string, @Body('status') status: VehicleStatus, @Req() req: any) {
    return this.fleetService.updateStatus(id, status, req.user);
  }

  @Patch(':id/immobilize')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.FLEET_MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Simulate remote anti-theft engine immobilization' })
  async toggleImmobilize(@Param('id') id: string, @Body('immobilize') immobilize: boolean, @Req() req: any) {
    return this.fleetService.toggleImmobilizer(id, immobilize, req.user);
  }
}
