import { Controller, Get, Param, UseGuards, Headers, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ReportesService } from './reportes.service';
import { PdfService } from './pdf.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('reportes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportesController {
  constructor(
    private readonly reportesService: ReportesService,
    private readonly pdfService: PdfService
  ) {}

  @Get('libreta/:matriculaId/:periodoId')
  @Roles('DIRECTOR', 'SECRETARIA', 'DOCENTE_TUTOR')
  getLibreta(
    @Headers('x-tenant-slug') slug: string,
    @Param('matriculaId') matriculaId: string,
    @Param('periodoId') periodoId: string,
  ) {
    // Retorna la data necesaria para construir la libreta en el frontend o generar PDF
    return this.reportesService.getLibretaData(slug, matriculaId, periodoId);
  }

  @Get('libreta/:matriculaId/:periodoId/pdf')
  @Roles('DIRECTOR', 'SECRETARIA', 'DOCENTE_TUTOR')
  async getLibretaPdf(
    @Headers('x-tenant-slug') slug: string,
    @Param('matriculaId') matriculaId: string,
    @Param('periodoId') periodoId: string,
    @Res() res: Response
  ) {
    const data = await this.reportesService.getLibretaData(slug, matriculaId, periodoId);
    const pdfBuffer = await this.pdfService.generateLibretaPdf(data);
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Libreta_${data.estudiante.dni}_${periodoId}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    
    res.end(pdfBuffer);
  }

  @Get('rendimiento/seccion/:seccionId')
  @Roles('DIRECTOR', 'SECRETARIA')
  getSeccionRendimiento(
    @Headers('x-tenant-slug') slug: string,
    @Param('seccionId') seccionId: string,
  ) {
    return this.reportesService.getSeccionRendimiento(slug, seccionId);
  }
}
