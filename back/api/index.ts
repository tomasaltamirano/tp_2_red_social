import type { Request, Response } from 'express';
import { createApp } from '../src/bootstrap.js';

let handler: ((req: Request, res: Response) => unknown) | undefined;

async function getHandler() {
  if (handler) {
    return handler;
  }

  const app = await createApp();
  await app.init();
  const appHandler = app.getHttpAdapter().getInstance();
  handler = appHandler;

  return appHandler;
}

export default async function vercelHandler(
  req: Request,
  res: Response,
): Promise<unknown> {
  const appHandler = await getHandler();
  return appHandler(req, res);
}
