import { Controller, Get, Post, Body, Query, UseGuards, Headers } from '@nestjs/common';
import { ApoderadosService } from './apoderados.service';
import { CreateApoderadoDto } from './dto/create-apoderado.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('apoderados')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ApoderadosController {
  constructor(private readonly apoderadosService: ApoderadosService) {}

  @Get()
  findByDniOrDoc(
    @Headers('x-tenant-slug') slug: string,
    @Query('q') query: string,
  ) {
    return this.apoderadosService.findByDniOrDoc(slug, query);
  }

  @Post()
  @Roles('DIRECTOR', 'SECRETARIA')
  create(
    @Headers('x-tenant-slug') slug: string,
    @Body() createApoderadoDto: CreateApoderadoDto,
  ) {
    return this.apoderadosService.create(slug, createApoderadoDto);
  }
}
