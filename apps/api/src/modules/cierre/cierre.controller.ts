import { Controller, Get, Post, Body, Patch, Param, UseGuards, Headers, Query } from '@nestjs/common';
import { CierreService } from './cierre.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('cierre')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CierreController {
  constructor(private readonly cierreService: CierreService) {}

  @Post('calcular/:anioEscolarId')
  @Roles('DIRECTOR')
  calcularCierre(
    @Headers('x-tenant-slug') slug: string,
    @Param('anioEscolarId') anioEscolarId: string,
    @CurrentUser() user: any,
  ) {
    return this.cierreService.calcularCierre(slug, anioEscolarId, user.id);
  }

  @Get('resultado/:anioEscolarId')
  @Roles('DIRECTOR', 'SECRETARIA')
  getResultado(
    @Headers('x-tenant-slug') slug: string,
    @Param('anioEscolarId') anioEscolarId: string,
    @Query('seccionId') seccionId?: string,
  ) {
    return this.cierreService.getResultado(slug, anioEscolarId, seccionId);
  }

  @Patch('caso-especial/:matriculaId')
  @Roles('DIRECTOR')
  setCasoEspecial(
    @Headers('x-tenant-slug') slug: string,
    @Param('matriculaId') matriculaId: string,
    @Body() dto: { resultado: string, justificacion: string },
  ) {
    return this.cierreService.setCasoEspecial(slug, matriculaId, dto);
  }

  @Post('export/excel/:anioEscolarId')
  @Roles('DIRECTOR')
  exportExcel(
    @Headers('x-tenant-slug') slug: string,
    @Param('anioEscolarId') anioEscolarId: string,
  ) {
    return this.cierreService.exportExcel(slug, anioEscolarId);
  }
}
