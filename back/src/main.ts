import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { configureApp } from './bootstrap.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  configureApp(app);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Servidor corriendo en puerto ${port}`);
}

bootstrap();