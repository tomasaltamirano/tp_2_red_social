import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('No se proporcionó un token de sesión');
    }

    try {
      const secret =
        this.configService.get<string>('JWT_SECRET') ||
        'profumi_secret_key_2026';

      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret,
      });
      (request as any).user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Token inválido o sesión expirada');
    }
  }

  private extractToken(request: Request): string | undefined {
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.split(' ')[1];
    }
    if (request.cookies && request.cookies.token) {
      return request.cookies.token;
    }
    return undefined;
  }
}
