import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Billing & Invoicing')
@Controller('billing')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('settlement/:reservationId')
  @ApiOperation({ summary: 'Calculate final settlement breakdown including excess mileage and fuel penalties' })
  async getSettlement(@Param('reservationId') id: string) {
    return this.billingService.calculateFinalBilling(id);
  }

  @Get('invoice/:reservationId/pdf')
  @ApiOperation({ summary: 'Download formal computer-generated PDF rental invoice' })
  async downloadInvoicePdf(@Param('reservationId') id: string, @Res() res: Response) {
    const pdfBuffer = await this.billingService.generateInvoicePdf(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Invoice-${id}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }
}
