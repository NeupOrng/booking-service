'use strict';

/**
 * Vercel Serverless Entry Point
 *
 * Vercel runs `pnpm run build` (nest build) before packaging.
 * This file imports from the compiled `dist/` output — never from TypeScript source —
 * to avoid esbuild's lack of emitDecoratorMetadata support.
 *
 * The NestJS app is cached in module scope so it is created only once per
 * warm Lambda instance (reduces cold-start penalty on subsequent requests).
 */

const express = require('express');

const expressApp = express();
let nestApp = null;

async function bootstrap() {
  const { NestFactory, Reflector } = require('@nestjs/core');
  const { ExpressAdapter } = require('@nestjs/platform-express');
  const { ValidationPipe, ClassSerializerInterceptor } = require('@nestjs/common');
  const session = require('express-session');
  const RedisStore = require('connect-redis').default;
  const { default: Redis } = require('ioredis');

  const { AppModule } = require('../dist/src/app.module');
  const { AllExceptionsFilter } = require('../dist/src/common/filters/all-exceptions.filter');

  // Redis-backed session store — required for Google OAuth state to survive
  // across serverless invocations (in-memory store would lose state between calls)
  const redisClient = new Redis(process.env.REDIS_URL);
  const sessionStore = new RedisStore({ client: redisClient });

  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp),
    { logger: ['error', 'warn'] },
  );

  app.use(
    session({
      store: sessionStore,
      secret: process.env.SESSION_SECRET || 'dev-session-secret',
      resave: false,
      saveUninitialized: true, // required for OAuth state
      cookie: {
        maxAge: 10 * 60 * 1000,
        secure: true,   // HTTPS only in production
        sameSite: 'lax',
      },
    }),
  );

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // No app.listen() — Vercel handles the HTTP server
  await app.init();
  return app;
}

module.exports = async (req, res) => {
  if (!nestApp) {
    nestApp = await bootstrap();
  }
  expressApp(req, res);
};
