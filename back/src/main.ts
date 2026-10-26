import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const isVercel = !!process.env.VERCEL;
  const baseUploadsDir = isVercel ? '/tmp/uploads' : join(process.cwd(), 'uploads');
  const profilesDir = join(baseUploadsDir, 'profiles');

  if (!existsSync(profilesDir)) {
    mkdirSync(profilesDir, { recursive: true });
  }

  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.useStaticAssets(baseUploadsDir, {
    prefix: '/uploads/',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Servidor Profumi corriendo en http://localhost:${port}`);
}
bootstrap();