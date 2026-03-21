import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  Headers,
  ParseIntPipe,
} from '@nestjs/common';
import { MatriculasService } from './matriculas.service';
import { CreateMatriculaDto } from './dto/create-matricula.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('matriculas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MatriculasController {
  constructor(private readonly matriculasService: MatriculasService) {}

  @Get()
  findAll(
    @Headers('x-tenant-slug') slug: string,
    @Query('anioEscolarId') anioEscolarId?: string,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('seccionId') seccionId?: string,
    @Query('estado') estado?: string,
    @Query('estudianteId') estudianteId?: string,
  ) {
    return this.matriculasService.findAll(slug, anioEscolarId, page, limit, { seccionId, estado, estudianteId });
  }

  @Get(':id')
  findOne(@Headers('x-tenant-slug') slug: string, @Param('id') id: string) {
    return this.matriculasService.findOne(slug, id);
  }

  @Post()
  @Roles('DIRECTOR', 'SECRETARIA')
  create(
    @Headers('x-tenant-slug') slug: string,
    @Body() createMatriculaDto: CreateMatriculaDto,
    @CurrentUser() user: any,
  ) {
    return this.matriculasService.create(slug, createMatriculaDto, user.id);
  }

  @Patch(':id')
  @Roles('DIRECTOR', 'SECRETARIA')
  update(
    @Headers('x-tenant-slug') slug: string,
    @Param('id') id: string,
    @Body() updateMatriculaDto: any,
  ) {
    return this.matriculasService.update(slug, id, updateMatriculaDto);
  }

  @Post(':id/retirar')
  @Roles('DIRECTOR')
  retirar(
    @Headers('x-tenant-slug') slug: string,
    @Param('id') id: string,
    @Body('fechaRetiro') fechaRetiro: string,
    @Body('motivo') motivo: string,
  ) {
    return this.matriculasService.retirar(slug, id, fechaRetiro, motivo);
  }
}
