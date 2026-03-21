import { Controller, Get, Param, UseGuards, Headers, Query } from '@nestjs/common';
import { ReportesService } from './reportes.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('reportes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

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

  @Get('rendimiento/seccion/:seccionId')
  @Roles('DIRECTOR', 'SECRETARIA')
  getSeccionRendimiento(
    @Headers('x-tenant-slug') slug: string,
    @Param('seccionId') seccionId: string,
  ) {
    return this.reportesService.getSeccionRendimiento(slug, seccionId);
  }
}
