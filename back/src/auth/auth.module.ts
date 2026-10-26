import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { User, UserSchema } from '../users/schemas/user.schema.js';
import { CloudinaryService } from '../cloudinary/cloudinary.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MulterModule.register({
      storage: memoryStorage(),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, CloudinaryService],
})
export class AuthModule {}
