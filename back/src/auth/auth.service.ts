import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import type { Response } from 'express';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../users/schemas/user.schema.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { CloudinaryService } from '../cloudinary/cloudinary.service.js';
import { JwtPayload } from './guards/jwt-auth.guard.js';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly cloudinaryService: CloudinaryService,
    private readonly jwtService: JwtService,
  ) {}

  private generateToken(user: UserDocument): string {
    const payload: JwtPayload = {
      sub: user._id.toString(),
      correo: user.correo,
      nombreUsuario: user.nombreUsuario,
      perfil: user.perfil as 'usuario' | 'administrador',
    };
    return this.jwtService.sign(payload);
  }

  private setTokenCookie(res: Response, token: string): void {
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 15 * 60 * 1000, // 15 minutos
    });
  }

  async register(
    registerDto: RegisterDto,
    file: Express.Multer.File,
    res: Response,
  ) {
    const { correo, nombreUsuario, password, repetirPassword, ...rest } =
      registerDto;

    if (password !== repetirPassword) {
      throw new BadRequestException('Las contraseñas no coinciden');
    }

    const existingUser = await this.userModel.findOne({
      $or: [{ correo: correo.toLowerCase() }, { nombreUsuario }],
    });

    if (existingUser) {
      throw new ConflictException(
        'El nombre de usuario o correo electrónico ya está registrado',
      );
    }

    const uploadResult = await this.cloudinaryService.uploadImage(
      file,
      'profumi/profiles',
    );
    if (!uploadResult || !uploadResult.secure_url) {
      throw new InternalServerErrorException(
        'Error al subir la imagen de perfil a Cloudinary',
      );
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new this.userModel({
      ...rest,
      correo: correo.toLowerCase(),
      nombreUsuario,
      password: hashedPassword,
      imagenPerfil: uploadResult.secure_url,
      perfil: rest.perfil || 'usuario',
    });

    const savedUser = await newUser.save();
    const userObject = savedUser.toObject();
    delete (userObject as any).password;

    const access_token = this.generateToken(savedUser);
    this.setTokenCookie(res, access_token);

    return {
      message: 'Usuario registrado exitosamente',
      user: userObject,
      access_token,
    };
  }

  async login(loginDto: LoginDto, res: Response) {
    const { identifier, password } = loginDto;

    const user = await this.userModel.findOne({
      $or: [
        { correo: identifier.toLowerCase() },
        { nombreUsuario: identifier },
      ],
    });

    if (!user) {
      throw new UnauthorizedException(
        'Usuario/correo o contraseña incorrectos',
      );
    }

    if (!user.activo) {
      throw new UnauthorizedException(
        'Tu cuenta se encuentra deshabilitada por un administrador',
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException(
        'Usuario/correo o contraseña incorrectos',
      );
    }

    const userObject = user.toObject();
    delete (userObject as any).password;

    const access_token = this.generateToken(user);
    this.setTokenCookie(res, access_token);

    return {
      message: 'Inicio de sesión exitoso',
      user: userObject,
      access_token,
    };
  }

  async autorizar(userPayload: JwtPayload) {
    const user = await this.userModel
      .findById(userPayload.sub)
      .select('-password');

    if (!user || !user.activo) {
      throw new UnauthorizedException('Usuario no válido o deshabilitado');
    }

    return {
      valid: true,
      user,
    };
  }

  async refreshToken(userPayload: JwtPayload, res: Response) {
    const { user } = await this.autorizar(userPayload);
    const access_token = this.generateToken(user);
    this.setTokenCookie(res, access_token);

    return {
      message: 'Sesión extendida exitosamente',
      access_token,
      user,
    };
  }

  logout(res: Response) {
    const isProd = process.env.NODE_ENV === 'production';
    res.clearCookie('token', {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
    });
    return { message: 'Sesión cerrada correctamente' };
  }
}
