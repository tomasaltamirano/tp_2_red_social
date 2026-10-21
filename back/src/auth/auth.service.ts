import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/logint.dto.js';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  async register(registerDto: RegisterDto) {
    const { password, repetirPassword, correo, nombreUsuario, ...rest } =
      registerDto;

    if (password !== repetirPassword) {
      throw new BadRequestException('Las contraseñas no coinciden');
    }

    const existeEmail = await this.usersService.findByEmail(correo);
    if (existeEmail) {
      throw new ConflictException('El correo ya está registrado');
    }

    const existeUsername =
      await this.usersService.findByUsername(nombreUsuario);
    if (existeUsername) {
      throw new ConflictException('El nombre de usuario ya está en uso');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const nuevoUsuario = await this.usersService.create({
      ...rest,
      correo,
      nombreUsuario,
      password: hashedPassword,
      imagenPerfil: registerDto.imagenPerfil || '',
      perfil: registerDto.perfil || 'usuario',
      fechaNacimiento: new Date(registerDto.fechaNacimiento),
    });

    // No devolvemos la contraseña
    const { password: _, ...usuarioSinPassword } = nuevoUsuario.toObject();
    return usuarioSinPassword;
  }

  async login(loginDto: LoginDto) {
    const { identifier, password } = loginDto;

    const usuario = await this.usersService.findByEmailOrUsername(identifier);

    if (!usuario) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!usuario.activo) {
      throw new UnauthorizedException(
        'Tu cuenta está deshabilitada. Contactá a un administrador.',
      );
    }

    const passwordValida = await bcrypt.compare(password, usuario.password);
    if (!passwordValida) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const { password: _, ...usuarioSinPassword } = usuario.toObject();
    return usuarioSinPassword;
  }
}
