import { Controller, Get, Post, Param, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InspectionsService } from './inspections.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user.schema';

@ApiTags('Digital Handover & Inspections')
@Controller('inspections')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class InspectionsController {
  constructor(private readonly inspectionsService: InspectionsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.FLEET_MANAGER, UserRole.AGENT)
  @ApiOperation({ summary: 'Submit digital check-in or check-out inspection with 360 damage logging' })
  async submitInspection(@Body() dto: any, @Req() req: any) {
    return this.inspectionsService.submitInspection(dto, req.user);
  }

  @Get('reservation/:id')
  @ApiOperation({ summary: 'Get all inspection reports for a specific reservation' })
  async getForReservation(@Param('id') id: string) {
    return this.inspectionsService.getInspectionsForReservation(id);
  }
}
