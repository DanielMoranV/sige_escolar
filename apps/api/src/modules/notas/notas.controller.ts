import { Controller, Get, Post, Body, Query, UseGuards, Headers, Param } from '@nestjs/common';
import { NotasService } from './notas.service';
import { SaveGrillaDto } from './dto/save-grilla.dto';
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
    @Query('seccionId') seccionId: string,
    @Query('periodoId') periodoId: string,
    @Query('areaId') areaId: string,
  ) {
    return this.notasService.getGrilla(slug, seccionId, periodoId, areaId);
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
  exportarSiagie(
    @Headers('x-tenant-slug') slug: string,
    @Query('periodoId') periodoId: string,
    @Query('seccionId') seccionId: string,
  ) {
    return this.notasService.exportarSiagie(slug, periodoId, seccionId);
  }
}
