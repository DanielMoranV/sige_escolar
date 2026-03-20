import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../database/prisma.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.usuario.findFirst({
      where: { email: dto.email, activo: true, deleted_at: null },
    });

    if (!user) throw new UnauthorizedException('Credenciales incorrectas');

    const passwordValida = await bcrypt.compare(dto.password, user.password_hash);
    if (!passwordValida) throw new UnauthorizedException('Credenciales incorrectas');

    const payload = { sub: user.id, tenantId: user.tenant_id, rol: user.rol };

    const accessToken = this.jwt.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwt.sign(
      { sub: user.id },
      { secret: process.env.JWT_REFRESH_SECRET ?? 'refresh-secret', expiresIn: '7d' },
    );

    const refreshHash = await bcrypt.hash(refreshToken, 10);
    await this.prisma.usuario.update({
      where: { id: user.id },
      data: { refresh_token_hash: refreshHash, ultimo_acceso: new Date() },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        nombres: user.nombres,
        apellidos: user.apellidos,
        rol: user.rol,
        tenantId: user.tenant_id,
      },
    };
  }

  async logout(userId: string) {
    await this.prisma.usuario.update({
      where: { id: userId },
      data: { refresh_token_hash: null },
    });
    return { message: 'Sesión cerrada correctamente' };
  }

  async me(userId: string) {
    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, nombres: true, apellidos: true,
        rol: true, tenant_id: true, activo: true, ultimo_acceso: true,
      },
    });
    return user;
  }
}
