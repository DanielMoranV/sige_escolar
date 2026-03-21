import { Controller, Get, Patch, Param, Body, UseGuards, Headers, Query } from '@nestjs/common';
import { SiagieService } from './siagie.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('siagie')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SiagieController {
  constructor(private readonly siagieService: SiagieService) {}

  @Get('sync-log')
  @Roles('DIRECTOR', 'SECRETARIA')
  getSyncLog(
    @Headers('x-tenant-slug') slug: string,
    @Query('anioEscolarId') anioEscolarId: string,
  ) {
    return this.siagieService.getSyncLog(slug, anioEscolarId);
  }

  @Patch('sync-log/:id/confirmar')
  @Roles('DIRECTOR')
  confirmarSync(
    @Headers('x-tenant-slug') slug: string,
    @Param('id') id: string,
    @Body() dto: { estado: string, observacion?: string },
    @CurrentUser() user: any,
  ) {
    return this.siagieService.confirmarSync(slug, id, dto, user.id);
  }
}
