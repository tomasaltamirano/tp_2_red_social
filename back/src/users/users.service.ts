import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema.js';
import { CloudinaryService } from '../cloudinary/cloudinary.service.js';
import { RegisterDto } from '../auth/dto/register.dto.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async listar() {
    return this.userModel
      .find()
      .select('-password')
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  async crearComoAdmin(
    dto: RegisterDto & { perfil: 'usuario' | 'administrador' },
    file: Express.Multer.File,
  ) {
    if (dto.password !== dto.repetirPassword) {
      throw new BadRequestException('Las contraseñas no coinciden');
    }

    const existe = await this.userModel.exists({
      $or: [
        { correo: dto.correo.toLowerCase() },
        { nombreUsuario: dto.nombreUsuario },
      ],
    });
    if (existe) {
      throw new ConflictException('El usuario o correo ya está registrado');
    }

    const upload = await this.cloudinaryService.uploadImage(
      file,
      'profumi/profiles',
    );
    if (!upload?.secure_url) {
      throw new InternalServerErrorException(
        'Error al subir la imagen a Cloudinary',
      );
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const nuevo = await this.userModel.create({
      ...dto,
      correo: dto.correo.toLowerCase(),
      password: hashedPassword,
      imagenPerfil: upload.secure_url,
      perfil: dto.perfil === 'administrador' ? 'administrador' : 'usuario',
      activo: true,
    });

    const { password: _, ...limpio } = nuevo.toObject();
    return { message: 'Usuario creado con éxito', user: limpio };
  }

  async cambiarEstado(id: string, activo: boolean, adminId: string) {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('ID inválido');
    if (!activo && id === adminId) {
      throw new BadRequestException('No podés deshabilitar tu propia cuenta');
    }

    const user = await this.userModel
      .findByIdAndUpdate(id, { $set: { activo } }, { new: true })
      .select('-password');

    if (!user) throw new NotFoundException('Usuario no encontrado');
    return {
      message: activo ? 'Usuario habilitado' : 'Usuario deshabilitado',
      user,
    };
  }
}
