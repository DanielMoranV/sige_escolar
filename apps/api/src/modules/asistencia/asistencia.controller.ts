import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  Headers,
  Res,
} from '@nestjs/common';
import { AsistenciaService } from './asistencia.service';
import { CreateAsistenciaBulkDto } from './dto/create-asistencia-bulk.dto';
import { CreateJustificacionDto, ReviewJustificacionDto } from './dto/justificacion.dto';
import { ExportSiagieQueryDto } from './dto/export-siagie-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('asistencia')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AsistenciaController {
  constructor(private readonly asistenciaService: AsistenciaService) {}

  @Get('seccion/:seccionId/:fecha')
  getSeccionAsistencia(
    @Headers('x-tenant-slug') slug: string,
    @Param('seccionId') seccionId: string,
    @Param('fecha') fecha: string,
  ) {
    return this.asistenciaService.getSeccionAsistencia(slug, seccionId, fecha);
  }

  @Post('seccion/:seccionId/:fecha')
  @Roles('DIRECTOR', 'DOCENTE_TUTOR', 'DOCENTE_AREA', 'SECRETARIA')
  registerBulk(
    @Headers('x-tenant-slug') slug: string,
    @Param('seccionId') seccionId: string,
    @Param('fecha') fecha: string,
    @Body() dto: CreateAsistenciaBulkDto,
    @CurrentUser() user: any,
  ) {
    return this.asistenciaService.registerBulk(slug, seccionId, fecha, dto, user.id);
  }

  @Get('justificaciones/pendientes')
  getJustificacionesPendientes(@Headers('x-tenant-slug') slug: string) {
    return this.asistenciaService.getJustificacionesPendientes(slug);
  }

  @Post('justificaciones')
  createJustificacion(@Headers('x-tenant-slug') slug: string, @Body() dto: CreateJustificacionDto) {
    return this.asistenciaService.createJustificacion(slug, dto);
  }

  @Patch('justificaciones/:id/revisar')
  @Roles('DIRECTOR', 'SECRETARIA')
  reviewJustificacion(
    @Headers('x-tenant-slug') slug: string,
    @Param('id') id: string,
    @Body() dto: ReviewJustificacionDto,
    @CurrentUser() user: any,
  ) {
    return this.asistenciaService.reviewJustificacion(slug, id, dto, user.id);
  }

  @Get('alertas')
  getAlertas(@Headers('x-tenant-slug') slug: string) {
    return this.asistenciaService.getAlertas(slug);
  }

  @Post('calcular-alertas')
  @Roles('DIRECTOR')
  calcularAlertas(
    @Headers('x-tenant-slug') slug: string,
    @Body('anioEscolarId') anioEscolarId: string,
  ) {
    return this.asistenciaService.calcularAlertas(slug, anioEscolarId);
  }

  @Get('export/siagie')
  @Roles('DIRECTOR')
  async exportarSiagie(
    @Headers('x-tenant-slug') slug: string,
    @Query() query: ExportSiagieQueryDto,
    @Res() res: any,
  ) {
    const excelBuffer = await this.asistenciaService.exportarSiagie(slug, query.mes, query.anioEscolarId, query.seccionId);
    
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="Asistencia_SIAGIE_${query.mes}.xlsx"`,
      'Content-Length': excelBuffer.length,
    });
    
    res.end(excelBuffer);
  }
}
