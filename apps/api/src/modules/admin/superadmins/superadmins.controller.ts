import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../guards/super-admin.guard';
import { SuperadminsService } from './superadmins.service';
import { CreateSuperadminDto } from './dto/create-superadmin.dto';

@Controller('admin/superadmins')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class SuperadminsController {
  constructor(private readonly superadminsService: SuperadminsService) {}

  @Get()
  async findAll() {
    return this.superadminsService.findAll();
  }

  @Post()
  async create(@Body() dto: CreateSuperadminDto) {
    return this.superadminsService.create(dto);
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    return this.superadminsService.remove(id, req.user.id);
  }
}
