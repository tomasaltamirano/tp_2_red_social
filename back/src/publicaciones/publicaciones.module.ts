import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { PublicacionesService } from './publicaciones.service.js';
import { PublicacionesController } from './publicaciones.controller.js';
import {
  Publicacion,
  PublicacionSchema,
} from './schemas/publicacion.schema.js';
import { AuthModule } from '../auth/auth.module.js';
import { CloudinaryService } from '../cloudinary/cloudinary.service.js';
import { ComentariosController } from './comentarios.controller.js';
import { EstadisticasController } from './estadisticas.controller.js';
import { EstadisticasService } from './estadisticas.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Publicacion.name, schema: PublicacionSchema },
    ]),
    MulterModule.register({
      storage: memoryStorage(),
    }),
    AuthModule,
  ],
  controllers: [
    PublicacionesController,
    ComentariosController,
    EstadisticasController,
  ],
  providers: [PublicacionesService, CloudinaryService, EstadisticasService],
})
export class PublicacionesModule {}
