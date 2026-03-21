import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../guards/super-admin.guard';
import { TenantsAdminService } from './tenants-admin.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Controller('admin/tenants')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class TenantsAdminController {
  constructor(private readonly tenantsAdminService: TenantsAdminService) {}

  @Get()
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('plan') plan?: string,
    @Query('activo') activoRaw?: string,
  ) {
    const activo = activoRaw !== undefined ? activoRaw === 'true' : undefined;
    return this.tenantsAdminService.findAll(page, limit, search, plan, activo);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tenantsAdminService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateTenantDto) {
    return this.tenantsAdminService.create(dto);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTenantDto,
  ) {
    return this.tenantsAdminService.update(id, dto);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('activo') activo: boolean,
  ) {
    return this.tenantsAdminService.updateStatus(id, activo);
  }

  @Get(':id/stats')
  async getStats(@Param('id', ParseUUIDPipe) id: string) {
    return this.tenantsAdminService.getStats(id);
  }

  @Get(':id/users')
  async getUsers(@Param('id', ParseUUIDPipe) id: string) {
    return this.tenantsAdminService.getUsers(id);
  }
}
