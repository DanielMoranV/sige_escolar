import { Controller, Get, Patch, Body, UseGuards, Headers, NotFoundException } from '@nestjs/common';
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

  @Patch('tenant')
  @Roles('DIRECTOR')
  async updateTenant(@CurrentUser() user: any, @Body() data: any) {
    return this.configService.updateTenant(user.tenantId, data);
  }
}
