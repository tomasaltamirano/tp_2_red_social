import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

export function configureApp(app: Awaited<ReturnType<typeof NestFactory.create>>) {
  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  return app;
}

export async function createApp() {
  const app = await NestFactory.create(AppModule, { cors: true });
  return configureApp(app);
}
