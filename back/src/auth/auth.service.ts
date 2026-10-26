import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../users/schemas/user.schema.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/logint.dto.js';
import { CloudinaryService } from '../cloudinary/cloudinary.service.js';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async register(registerDto: RegisterDto, file: Express.Multer.File) {
    const { correo, nombreUsuario, password, repetirPassword, ...rest } =
      registerDto;

    // 1. Validar que las contraseñas coincidan
    if (password !== repetirPassword) {
      throw new BadRequestException('Las contraseñas no coinciden');
    }

    // 2. Verificar si el correo o nombreUsuario ya existen
    const existingUser = await this.userModel.findOne({
      $or: [{ correo }, { nombreUsuario }],
    });

    if (existingUser) {
      throw new ConflictException(
        'El nombre de usuario o correo electrónico ya está registrado',
      );
    }

    // 3. Subir la imagen a Cloudinary
    const uploadResult = await this.cloudinaryService.uploadImage(file);
    if (!uploadResult || !uploadResult.secure_url) {
      throw new InternalServerErrorException(
        'Error al subir la imagen de perfil a Cloudinary',
      );
    }

    // 4. Hashear contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 5. Crear y guardar el usuario en MongoDB
    const newUser = new this.userModel({
      ...rest,
      correo,
      nombreUsuario,
      password: hashedPassword,
      imagenPerfil: uploadResult.secure_url,
      perfil: rest.perfil || 'usuario',
    });

    const savedUser = await newUser.save();
    const userObject = savedUser.toObject();
    delete (userObject as any).password;

    return {
      message: 'Usuario registrado exitosamente',
      user: userObject,
    };
  }

  async login(loginDto: LoginDto) {
    const { identifier, password } = loginDto;

    // Buscar tanto por correo como por nombreUsuario usando identifier
    const user = await this.userModel.findOne({
      $or: [{ correo: identifier }, { nombreUsuario: identifier }],
    });

    if (!user) {
      throw new UnauthorizedException(
        'Usuario/correo o contraseña incorrectos',
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

    return {
      message: 'Inicio de sesión exitoso',
      user: userObject,
    };
  }
}
