import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

export class JwtPayload {
  sub: string;
  correo: string;
  nombreUsuario: string;
  perfil: 'usuario' | 'administrador';
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('No se proporcionó un token de sesión');
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: process.env.JWT_SECRET || 'profumi_secret_key_2026',
      });
      (request as any).user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Token inválido o sesión expirada');
    }
  }

  private extractToken(request: Request): string | undefined {
    // 1. Intentar leer desde Header Authorization: Bearer <token>
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.split(' ')[1];
    }
    // 2. Fallback a cookie HttpOnly
    if (request.cookies && request.cookies.token) {
      return request.cookies.token;
    }
    return undefined;
  }
}
