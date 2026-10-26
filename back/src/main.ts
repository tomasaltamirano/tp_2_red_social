import { createApp } from './bootstrap.js';

async function bootstrap() {
  const app = await createApp();

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Servidor corriendo en puerto ${port}`);
}

bootstrap();