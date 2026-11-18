import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose'; // NUEVO
import { Model } from 'mongoose'; // NUEVO
import type { Request } from 'express';
import { User, UserDocument } from '../../users/schemas/user.schema.js'; // NUEVO

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
    @InjectModel(User.name) private userModel: Model<UserDocument>, // NUEVO: Inyectamos el modelo User
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('No se proporcionó un token de sesión');
    }

    let payload: JwtPayload;
    try {
      const secret =
        this.configService.get<string>('JWT_SECRET') ||
        'profumi_secret_key_2026';

      payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret,
      });
    } catch {
      throw new UnauthorizedException('Token inválido o expirado');
    }

    // Validamos fuera del try/catch para que NestJS envíe este mensaje exacto
    const usuarioDb = await this.userModel
      .findById(payload.sub)
      .select('activo')
      .lean();

    if (!usuarioDb || usuarioDb.activo === false) {
      throw new UnauthorizedException(
        'Tu cuenta fue deshabilitada por un administrador',
      );
    }

    (request as any).user = payload;
    return true;
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
