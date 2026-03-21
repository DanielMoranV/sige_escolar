import { Controller, Get, Param, UseGuards, Headers } from '@nestjs/common';
import { PortalService } from './portal.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('portal')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PortalController {
  constructor(private readonly portalService: PortalService) {}

  @Get('hijo')
  @Roles('APODERADO')
  getHijoResumen(
    @Headers('x-tenant-slug') slug: string,
    @CurrentUser() user: any,
  ) {
    return this.portalService.getHijoResumen(slug, user.id);
  }

  @Get('notas/:periodoId')
  @Roles('APODERADO')
  getNotas(
    @Headers('x-tenant-slug') slug: string,
    @Param('periodoId') periodoId: string,
    @CurrentUser() user: any,
  ) {
    return this.portalService.getNotas(slug, user.id, periodoId);
  }

  @Get('asistencia')
  @Roles('APODERADO')
  getAsistencia(
    @Headers('x-tenant-slug') slug: string,
    @CurrentUser() user: any,
  ) {
    return this.portalService.getAsistencia(slug, user.id);
  }

  @Get('libretas')
  @Roles('APODERADO')
  getLibretasDisponibles(
    @Headers('x-tenant-slug') slug: string,
    @CurrentUser() user: any,
  ) {
    return this.portalService.getLibretasDisponibles(slug, user.id);
  }
}
