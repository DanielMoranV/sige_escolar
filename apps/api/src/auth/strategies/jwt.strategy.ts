import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'secret',
    });
  }

  async validate(payload: { sub: string; tenantId: string | null; rol: string }) {
    const user = await this.prisma.usuario.findFirst({
      where: { id: payload.sub, activo: true, deleted_at: null },
    });
    if (!user) throw new UnauthorizedException('Usuario no encontrado o inactivo');
    return user;
  }
}
