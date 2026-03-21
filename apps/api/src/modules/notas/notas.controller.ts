import { Controller, Get, Post, Body, Query, UseGuards, Headers, Param, Res } from '@nestjs/common';
import { NotasService } from './notas.service';
import { SaveGrillaDto } from './dto/save-grilla.dto';
import { GetGrillaQueryDto, ExportNotasQueryDto } from './dto/get-grilla-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('notas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotasController {
  constructor(private readonly notasService: NotasService) {}

  @Get('grilla')
  getGrilla(
    @Headers('x-tenant-slug') slug: string,
    @Query() query: GetGrillaQueryDto,
  ) {
    return this.notasService.getGrilla(slug, query.seccionId, query.periodoId, query.areaId);
  }

  @Post('grilla')
  @Roles('DIRECTOR', 'DOCENTE_TUTOR', 'DOCENTE_AREA')
  saveGrilla(
    @Headers('x-tenant-slug') slug: string,
    @Body() dto: SaveGrillaDto,
    @CurrentUser() user: any,
  ) {
    return this.notasService.saveGrilla(slug, dto, user.id);
  }

  @Get('estudiante/:matriculaId')
  getEstudianteNotas(
    @Headers('x-tenant-slug') slug: string,
    @Param('matriculaId') matriculaId: string,
  ) {
    return this.notasService.getEstudianteNotas(slug, matriculaId);
  }

  @Post('cerrar-periodo')
  @Roles('DIRECTOR')
  cerrarPeriodo(
    @Headers('x-tenant-slug') slug: string,
    @Body('periodoId') periodoId: string,
    @Body('seccionId') seccionId: string,
    @CurrentUser() user: any,
  ) {
    return this.notasService.cerrarPeriodo(slug, periodoId, seccionId, user.id);
  }

  @Get('export/siagie')
  @Roles('DIRECTOR')
  async exportarSiagie(
    @Headers('x-tenant-slug') slug: string,
    @Query() query: ExportNotasQueryDto,
    @CurrentUser() user: any,
    @Res() res: any,
  ) {
    const excelBuffer = await this.notasService.exportarSiagie(slug, query.periodoId, query.seccionId, user.id);
    
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="Notas_SIAGIE_${query.periodoId}.xlsx"`,
      'Content-Length': excelBuffer.length,
    });
    
    res.end(excelBuffer);
  }
}
