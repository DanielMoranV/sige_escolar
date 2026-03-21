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
      include: { tenant: true },
    });

    if (!user) throw new UnauthorizedException('Credenciales incorrectas');

    const passwordValida = await bcrypt.compare(dto.password, user.password_hash);
    if (!passwordValida) throw new UnauthorizedException('Credenciales incorrectas');

    const payload = { 
      sub: user.id, 
      tenantId: user.tenant_id, 
      rol: user.rol,
      needsChange: user.needs_password_change 
    };

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
        tenantName: user.tenant?.nombre,
        needsPasswordChange: user.needs_password_change,
      },
    };
  }

  async refreshToken(userId: string, token: string) {
    const user = await this.prisma.usuario.findUnique({
      where: { id: userId, activo: true, deleted_at: null },
    });

    if (!user || !user.refresh_token_hash) {
      throw new UnauthorizedException('Acceso denegado');
    }

    const isMatch = await bcrypt.compare(token, user.refresh_token_hash);
    if (!isMatch) throw new UnauthorizedException('Token inválido');

    const payload = { 
      sub: user.id, 
      tenantId: user.tenant_id, 
      rol: user.rol,
      needsChange: user.needs_password_change 
    };

    return {
      accessToken: this.jwt.sign(payload, { expiresIn: '15m' }),
    };
  }

  async changePassword(userId: string, currentPass: string, newPass: string) {
    const user = await this.prisma.usuario.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Usuario no encontrado');

    const isMatch = await bcrypt.compare(currentPass, user.password_hash);
    if (!isMatch) throw new UnauthorizedException('Contraseña actual incorrecta');

    const newHash = await bcrypt.hash(newPass, 10);
    await this.prisma.usuario.update({
      where: { id: userId },
      data: { 
        password_hash: newHash,
        needs_password_change: false 
      },
    });

    return { message: 'Contraseña actualizada correctamente' };
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
      include: { tenant: true },
    });
    if (!user) return null;
    
    return {
      id: user.id,
      email: user.email,
      nombres: user.nombres,
      apellidos: user.apellidos,
      rol: user.rol,
      tenantId: user.tenant_id,
      tenantName: user.tenant?.nombre,
      activo: user.activo,
      ultimo_acceso: user.ultimo_acceso,
    };
  }
}
