import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Headers,
} from '@nestjs/common';
import { DocentesService } from './docentes.service';
import { CreateDocenteDto, UpdateDocenteDto, AsignarDto } from './dto/docente.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('docentes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocentesController {
  constructor(private readonly docentesService: DocentesService) {}

  @Get()
  getAll(@Headers('x-tenant-slug') slug: string) {
    return this.docentesService.getAll(slug);
  }

  @Get('mis-asignaciones')
  @Roles('DOCENTE_TUTOR', 'DOCENTE_AREA', 'DIRECTOR', 'SUPER_ADMIN')
  getMisAsignaciones(
    @Headers('x-tenant-slug') slug: string,
    @CurrentUser() user: any,
  ) {
    return this.docentesService.getMisAsignaciones(slug, user.id);
  }

  @Get(':id/asignaciones')
  getAsignaciones(
    @Headers('x-tenant-slug') slug: string,
    @Param('id') id: string,
  ) {
    return this.docentesService.getAsignaciones(slug, id);
  }

  @Post()
  @Roles('DIRECTOR', 'SUPER_ADMIN')
  create(
    @Headers('x-tenant-slug') slug: string,
    @Body() createDocenteDto: CreateDocenteDto,
  ) {
    return this.docentesService.create(slug, createDocenteDto);
  }

  @Patch(':id')
  @Roles('DIRECTOR', 'SUPER_ADMIN')
  update(
    @Headers('x-tenant-slug') slug: string,
    @Param('id') id: string,
    @Body() updateDocenteDto: UpdateDocenteDto,
  ) {
    return this.docentesService.update(slug, id, updateDocenteDto);
  }

  @Post('asignaciones')
  @Roles('DIRECTOR', 'SUPER_ADMIN')
  asignar(
    @Headers('x-tenant-slug') slug: string,
    @Body() asignarDto: AsignarDto,
  ) {
    return this.docentesService.asignar(slug, asignarDto);
  }

  @Delete('asignaciones/:id')
  @Roles('DIRECTOR', 'SUPER_ADMIN')
  removeAsignacion(
    @Headers('x-tenant-slug') slug: string,
    @Param('id') id: string,
  ) {
    return this.docentesService.removeAsignacion(slug, id);
  }
}
