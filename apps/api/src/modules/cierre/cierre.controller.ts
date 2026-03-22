import { Controller, Get, Post, Body, Patch, Param, UseGuards, Headers, Query, Res, Put } from '@nestjs/common';
import { CierreService } from './cierre.service';
import { GetResultadoQueryDto } from './dto/get-resultado-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('cierre')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CierreController {
  constructor(private readonly cierreService: CierreService) {}

  @Post('calcular/:anioEscolarId')
  @Roles('DIRECTOR', 'SUPER_ADMIN')
  calcularCierre(
    @Headers('x-tenant-slug') slug: string,
    @Param('anioEscolarId') anioEscolarId: string,
    @CurrentUser() user: any,
  ) {
    return this.cierreService.calcularCierre(slug, anioEscolarId, user.id);
  }

  @Get('resultado/:anioEscolarId')
  @Roles('DIRECTOR', 'SECRETARIA', 'SUPER_ADMIN')
  getResultado(
    @Headers('x-tenant-slug') slug: string,
    @Param('anioEscolarId') anioEscolarId: string,
    @Query() query: GetResultadoQueryDto,
  ) {
    return this.cierreService.getResultado(slug, anioEscolarId, query.seccionId);
  }

  @Patch('caso-especial/:matriculaId')
  @Roles('DIRECTOR', 'SUPER_ADMIN')
  setCasoEspecial(
    @Headers('x-tenant-slug') slug: string,
    @Param('matriculaId') matriculaId: string,
    @Body() dto: { resultado: string, justificacion: string },
  ) {
    return this.cierreService.setCasoEspecial(slug, matriculaId, dto);
  }

  @Get('recuperacion/:anioEscolarId')
  @Roles('DIRECTOR', 'SECRETARIA', 'SUPER_ADMIN')
  getRecuperacion(
    @Headers('x-tenant-slug') slug: string,
    @Param('anioEscolarId') anioEscolarId: string,
    @Query() query: GetResultadoQueryDto,
  ) {
    return this.cierreService.getRecuperacion(slug, anioEscolarId, query.seccionId);
  }

  @Put('recuperacion/:matriculaId/area/:areaId')
  @Roles('DIRECTOR', 'SECRETARIA', 'SUPER_ADMIN')
  saveNotasRecuperacion(
    @Headers('x-tenant-slug') slug: string,
    @Param('matriculaId') matriculaId: string,
    @Param('areaId') areaId: string,
    @Body() body: { notas: Record<string, { literal: string | null; numerico: number | null }> },
  ) {
    return this.cierreService.saveNotasRecuperacion(slug, matriculaId, areaId, body.notas);
  }

  @Post('recuperacion/:matriculaId/recalcular')
  @Roles('DIRECTOR', 'SUPER_ADMIN')
  recalcularPostRecuperacion(
    @Headers('x-tenant-slug') slug: string,
    @Param('matriculaId') matriculaId: string,
  ) {
    return this.cierreService.recalcularPostRecuperacion(slug, matriculaId);
  }

  @Post('export/excel/:anioEscolarId')
  @Roles('DIRECTOR', 'SUPER_ADMIN')
  async exportExcel(
    @Headers('x-tenant-slug') slug: string,
    @Param('anioEscolarId') anioEscolarId: string,
    @Res() res: any,
  ) {
    const excelBuffer = await this.cierreService.exportExcel(slug, anioEscolarId);
    
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="Cierre_Anual_${anioEscolarId}.xlsx"`,
      'Content-Length': excelBuffer.length,
    });
    
    res.end(excelBuffer);
  }
}
