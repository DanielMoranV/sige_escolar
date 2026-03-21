import { Controller, Get, UseGuards, Headers, NotFoundException, BadRequestException } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SchoolConfigService } from '../config/school-config.service';

@Controller('dashboard-escolar')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly configService: SchoolConfigService,
  ) {}

  @Get('stats')
  async getStats(@Headers('x-tenant-slug') slug: string) {
    if (!slug) throw new BadRequestException('Header x-tenant-slug es requerido');
    const anio = await this.configService.getAnioEscolar(slug);
    return this.dashboardService.getStats(slug, anio.id);
  }
}
