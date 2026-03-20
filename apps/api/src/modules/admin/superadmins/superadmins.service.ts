import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateSuperadminDto } from './dto/create-superadmin.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SuperadminsService {
  private readonly logger = new Logger(SuperadminsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const superadmins = await this.prisma.usuario.findMany({
      where: {
        rol: 'SUPER_ADMIN',
        deleted_at: null,
      },
      select: {
        id: true,
        email: true,
        nombres: true,
        apellidos: true,
        rol: true,
        activo: true,
        created_at: true,
        updated_at: true,
        // Never include password_hash
      },
      orderBy: { created_at: 'asc' },
    });

    return superadmins;
  }

  async create(dto: CreateSuperadminDto) {
    const existing = await this.prisma.usuario.findFirst({
      where: { email: dto.email, deleted_at: null },
    });

    if (existing) {
      throw new ConflictException(`El email "${dto.email}" ya está en uso`);
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const superadmin = await this.prisma.usuario.create({
      data: {
        email: dto.email,
        password_hash: passwordHash,
        nombres: dto.nombres,
        apellidos: dto.apellidos,
        rol: 'SUPER_ADMIN',
        tenant_id: null,
        activo: true,
      },
      select: {
        id: true,
        email: true,
        nombres: true,
        apellidos: true,
        rol: true,
        activo: true,
        created_at: true,
      },
    });

    return superadmin;
  }

  async remove(id: string, currentUserId: string) {
    if (id === currentUserId) {
      throw new ForbiddenException('No puedes eliminar tu propio usuario');
    }

    const superadmin = await this.prisma.usuario.findFirst({
      where: { id, rol: 'SUPER_ADMIN', deleted_at: null },
    });

    if (!superadmin) {
      throw new NotFoundException(`Super admin ${id} no encontrado`);
    }

    await this.prisma.usuario.update({
      where: { id },
      data: { deleted_at: new Date(), activo: false },
    });

    return { message: 'Super admin eliminado correctamente' };
  }
}
