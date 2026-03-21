import { Controller, Get, Post, Patch, Body, Param, UseGuards, Headers, NotFoundException } from '@nestjs/common';
import { SchoolConfigService } from './school-config.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('config')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SchoolConfigController {
  constructor(
    private readonly configService: SchoolConfigService,
  ) {}

  @Get('anio-escolar')
  async getAnioEscolar(@Headers('x-tenant-slug') slug: string) {
    if (!slug) throw new NotFoundException('Tenant no especificado');
    return this.configService.getAnioEscolar(slug);
  }

  @Get('periodos')
  async getPeriodos(@Headers('x-tenant-slug') slug: string) {
    const anio = await this.configService.getAnioEscolar(slug);
    return this.configService.getPeriodos(slug, anio.id);
  }

  @Get('regimen')
  async getRegimen(@Headers('x-tenant-slug') slug: string) {
    const anio = await this.configService.getAnioEscolar(slug);
    return this.configService.getRegimen(slug, anio.id);
  }

  @Get('areas')
  async getAreas(@Headers('x-tenant-slug') slug: string) {
    const anio = await this.configService.getAnioEscolar(slug);
    return this.configService.getAreas(slug, anio.id);
  }

  @Get('secciones')
  async getSecciones(@Headers('x-tenant-slug') slug: string) {
    const anio = await this.configService.getAnioEscolar(slug);
    return this.configService.getSecciones(slug, anio.id);
  }

  @Get('secciones/all')
  @Roles('DIRECTOR')
  async getAllSecciones(@Headers('x-tenant-slug') slug: string) {
    const anio = await this.configService.getAnioEscolar(slug);
    return this.configService.getAllSecciones(slug, anio.id);
  }

  @Get('grados')
  async getGrados(@Headers('x-tenant-slug') slug: string) {
    if (!slug) throw new NotFoundException('Tenant no especificado');
    return this.configService.getGrados(slug);
  }

  @Post('secciones')
  @Roles('DIRECTOR')
  async createSeccion(@Headers('x-tenant-slug') slug: string, @Body() body: any) {
    const anio = await this.configService.getAnioEscolar(slug);
    return this.configService.createSeccion(slug, anio.id, body);
  }

  @Patch('secciones/:id')
  @Roles('DIRECTOR')
  async updateSeccion(@Headers('x-tenant-slug') slug: string, @Param('id') id: string, @Body() body: any) {
    return this.configService.updateSeccion(slug, id, body);
  }

  @Get('areas/all')
  @Roles('DIRECTOR')
  async getAllAreas(@Headers('x-tenant-slug') slug: string) {
    const anio = await this.configService.getAnioEscolar(slug);
    return this.configService.getAllAreas(slug, anio.id);
  }

  @Post('areas')
  @Roles('DIRECTOR')
  async createArea(@Headers('x-tenant-slug') slug: string, @Body() body: any) {
    const anio = await this.configService.getAnioEscolar(slug);
    return this.configService.createArea(slug, anio.id, body);
  }

  @Patch('areas/:id')
  @Roles('DIRECTOR')
  async updateArea(@Headers('x-tenant-slug') slug: string, @Param('id') id: string, @Body() body: any) {
    return this.configService.updateArea(slug, id, body);
  }

  @Get('areas/:id/competencias')
  @Roles('DIRECTOR')
  async getCompetencias(@Headers('x-tenant-slug') slug: string, @Param('id') id: string) {
    return this.configService.getCompetencias(slug, id);
  }

  @Post('competencias')
  @Roles('DIRECTOR')
  async createCompetencia(@Headers('x-tenant-slug') slug: string, @Body() body: any) {
    return this.configService.createCompetencia(slug, body.areaIeId, body);
  }

  @Patch('competencias/:id')
  @Roles('DIRECTOR')
  async updateCompetencia(@Headers('x-tenant-slug') slug: string, @Param('id') id: string, @Body() body: any) {
    return this.configService.updateCompetencia(slug, id, body);
  }

  @Get('asistencia')
  @Roles('DIRECTOR')
  async getConfigAsistencia(@Headers('x-tenant-slug') slug: string) {
    const anio = await this.configService.getAnioEscolar(slug);
    return this.configService.getConfigAsistencia(slug, anio.id);
  }

  @Patch('asistencia')
  @Roles('DIRECTOR')
  async updateConfigAsistencia(@Headers('x-tenant-slug') slug: string, @Body() body: any) {
    const anio = await this.configService.getAnioEscolar(slug);
    return this.configService.updateConfigAsistencia(slug, anio.id, body);
  }

  @Patch('tenant')
  @Roles('DIRECTOR')
  async updateTenant(@CurrentUser() user: any, @Body() data: any) {
    return this.configService.updateTenant(user.tenantId, data);
  }
}
