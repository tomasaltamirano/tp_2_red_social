import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Publicacion,
  PublicacionDocument,
} from './schemas/publicacion.schema.js';
import { CreatePublicacionDto } from './dto/create-publicacion.dto.js';
import { GetPublicacionesQueryDto } from './dto/get-publicaciones-query.dto.js';
import { CloudinaryService } from '../cloudinary/cloudinary.service.js';
import { JwtPayload } from '../auth/guards/jwt-auth.guard.js';

@Injectable()
export class PublicacionesService {
  constructor(
    @InjectModel(Publicacion.name)
    private readonly publicacionModel: Model<PublicacionDocument>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async crear(
    createDto: CreatePublicacionDto,
    user: JwtPayload,
    file?: Express.Multer.File,
  ) {
    let imagenUrl = '';

    if (file) {
      const uploadResult = await this.cloudinaryService.uploadImage(
        file,
        'profumi/posts',
      );
      if (!uploadResult || !uploadResult.secure_url) {
        throw new InternalServerErrorException(
          'Error al subir la imagen de la publicación',
        );
      }
      imagenUrl = uploadResult.secure_url;
    }

    const notasArray = createDto.notas
      ? createDto.notas
          .split(',')
          .map((n) => n.trim())
          .filter(Boolean)
      : [];

    const nuevaPublicacion = new this.publicacionModel({
      titulo: createDto.titulo,
      descripcion: createDto.descripcion,
      imagenUrl,
      notas: notasArray,
      usuario: new Types.ObjectId(user.sub),
      likes: [],
      likesCount: 0,
      comentarios: [],
      activo: true,
    });

    const guardada = await nuevaPublicacion.save();
    return guardada.populate(
      'usuario',
      'nombre apellido nombreUsuario imagenPerfil perfil',
    );
  }

  async listar(query: GetPublicacionesQueryDto) {
    const sortBy = query.sortBy === 'likes' ? 'likes' : 'fecha';
    const userId = query.userId;
    const offset = Number(query.offset ?? 0);
    const limit = Number(query.limit ?? 10);

    const filter: Record<string, any> = { activo: true };
    if (userId) {
      filter.usuario = new Types.ObjectId(userId);
    }

    const sortCriteria: Record<string, 1 | -1> =
      sortBy === 'likes'
        ? { likesCount: -1, createdAt: -1 }
        : { createdAt: -1 };

    const [items, total] = await Promise.all([
      this.publicacionModel
        .find(filter)
        .sort(sortCriteria)
        .skip(offset)
        .limit(limit)
        .populate(
          'usuario',
          'nombre apellido nombreUsuario imagenPerfil perfil',
        )
        .populate(
          'comentarios.usuario',
          'nombre apellido nombreUsuario imagenPerfil',
        )
        .exec(),
      this.publicacionModel.countDocuments(filter).exec(),
    ]);

    return {
      items,
      total,
      offset,
      limit,
      hasMore: offset + items.length < total,
    };
  }

  async bajaLogica(publicacionId: string, user: JwtPayload) {
    if (!Types.ObjectId.isValid(publicacionId)) {
      throw new BadRequestException('ID de publicación inválido');
    }

    const publicacion = await this.publicacionModel.findOne({
      _id: publicacionId,
      activo: true,
    });

    if (!publicacion) {
      throw new NotFoundException(
        'La publicación no existe o ya fue eliminada',
      );
    }

    const esAutor = publicacion.usuario.toString() === user.sub;
    const esAdmin = user.perfil === 'administrador';

    if (!esAutor && !esAdmin) {
      throw new ForbiddenException(
        'No tenés permisos para eliminar esta publicación',
      );
    }

    publicacion.activo = false;
    await publicacion.save();

    return {
      message: 'Publicación eliminada correctamente',
      id: publicacion._id,
    };
  }

  async darMeGusta(publicacionId: string, user: JwtPayload) {
    if (!Types.ObjectId.isValid(publicacionId)) {
      throw new BadRequestException('ID de publicación inválido');
    }

    const publicacion = await this.publicacionModel.findOne({
      _id: publicacionId,
      activo: true,
    });

    if (!publicacion) {
      throw new NotFoundException('Publicación no encontrada');
    }

    const userObjectId = new Types.ObjectId(user.sub);
    const yaDioLike = publicacion.likes.some(
      (id) => id.toString() === user.sub,
    );

    if (yaDioLike) {
      throw new BadRequestException(
        'Ya le diste "Me gusta" a esta publicación',
      );
    }

    publicacion.likes.push(userObjectId);
    publicacion.likesCount = publicacion.likes.length;
    await publicacion.save();

    return {
      message: 'Me gusta registrado',
      likesCount: publicacion.likesCount,
      likes: publicacion.likes,
    };
  }

  async quitarMeGusta(publicacionId: string, user: JwtPayload) {
    if (!Types.ObjectId.isValid(publicacionId)) {
      throw new BadRequestException('ID de publicación inválido');
    }

    const publicacion = await this.publicacionModel.findOne({
      _id: publicacionId,
      activo: true,
    });

    if (!publicacion) {
      throw new NotFoundException('Publicación no encontrada');
    }

    const index = publicacion.likes.findIndex(
      (id) => id.toString() === user.sub,
    );

    if (index === -1) {
      throw new BadRequestException(
        'No podés quitar el "Me gusta" porque no reaccionaste previamente a esta publicación',
      );
    }

    publicacion.likes.splice(index, 1);
    publicacion.likesCount = publicacion.likes.length;
    await publicacion.save();

    return {
      message: 'Me gusta eliminado',
      likesCount: publicacion.likesCount,
      likes: publicacion.likes,
    };
  }
}
