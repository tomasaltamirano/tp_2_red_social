import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { PublicacionesModule } from './publicaciones/publicaciones.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.CONNECTION_STRING!),
    AuthModule,
    UsersModule,
    PublicacionesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}