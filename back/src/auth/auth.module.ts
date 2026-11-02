import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { memoryStorage } from 'multer';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { User, UserSchema } from '../users/schemas/user.schema.js';
import { CloudinaryService } from '../cloudinary/cloudinary.service.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MulterModule.register({
      storage: memoryStorage(),
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret:
          configService.get<string>('JWT_SECRET') || 'profumi_secret_key_2026',
        signOptions: { expiresIn: '1m' }, // 15 minutos según consigna
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, CloudinaryService, JwtAuthGuard],
  exports: [JwtModule, JwtAuthGuard, AuthService],
})
export class AuthModule {}
