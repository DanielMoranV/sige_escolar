import { Controller, Post, Body, UseGuards, Headers } from '@nestjs/common';
import { ExoneracionesService } from './exoneraciones.service';
import { CreateExoneracionDto } from './dto/create-exoneracion.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('exoneraciones')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExoneracionesController {
  constructor(private readonly exoneracionesService: ExoneracionesService) {}

  @Post()
  @Roles('DIRECTOR', 'SECRETARIA')
  create(
    @Headers('x-tenant-slug') slug: string,
    @Body() createExoneracionDto: CreateExoneracionDto,
    @CurrentUser() user: any,
  ) {
    return this.exoneracionesService.create(slug, createExoneracionDto, user.id);
  }
}
