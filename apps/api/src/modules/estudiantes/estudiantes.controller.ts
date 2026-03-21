import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Headers,
} from '@nestjs/common';
import { EstudiantesService } from './estudiantes.service';
import { CreateEstudianteDto } from './dto/create-estudiante.dto';
import { FindAllEstudiantesQueryDto } from './dto/find-all-estudiantes-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('estudiantes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EstudiantesController {
  constructor(private readonly estudiantesService: EstudiantesService) {}

  @Get()
  findAll(
    @Headers('x-tenant-slug') slug: string,
    @Query() query: FindAllEstudiantesQueryDto,
  ) {
    return this.estudiantesService.findAll(slug, query.page, query.limit, query.search);
  }

  @Get('validate-dni/:dni')
  validateDni(@Param('dni') dni: string) {
    return this.estudiantesService.validateDni(dni);
  }

  @Get(':id')
  findOne(@Headers('x-tenant-slug') slug: string, @Param('id') id: string) {
    return this.estudiantesService.findOne(slug, id);
  }

  @Get(':id/apoderados')
  findApoderados(@Headers('x-tenant-slug') slug: string, @Param('id') id: string) {
    return this.estudiantesService.findApoderados(slug, id);
  }

  @Post()
  @Roles('DIRECTOR', 'SECRETARIA')
  create(@Headers('x-tenant-slug') slug: string, @Body() createEstudianteDto: CreateEstudianteDto) {
    return this.estudiantesService.create(slug, createEstudianteDto);
  }

  @Patch(':id')
  @Roles('DIRECTOR', 'SECRETARIA')
  update(
    @Headers('x-tenant-slug') slug: string,
    @Param('id') id: string,
    @Body() updateEstudianteDto: any,
  ) {
    return this.estudiantesService.update(slug, id, updateEstudianteDto);
  }

  @Delete(':id')
  @Roles('DIRECTOR')
  remove(@Headers('x-tenant-slug') slug: string, @Param('id') id: string) {
    return this.estudiantesService.remove(slug, id);
  }
}
