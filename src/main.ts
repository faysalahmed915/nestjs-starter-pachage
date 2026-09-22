import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import express from 'express';
import { toNodeHandler } from 'better-auth/node';

import { AppModule } from './app.module.js';
import { AppValidationPipe } from './common/pipes/app-validation.pipe.js';
import { auth } from './modules/auth/auth.js';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,

    // Better Auth's Node handler must receive the request before
    // Express body parsers consume the request body.
    bodyParser: false,
  });

  const configService = app.get(ConfigService);

  // Get the underlying Express application because Nest's
  // INestApplication does not expose Express-specific methods such as .all().
  const httpAdapter = app.getHttpAdapter();
  const expressApp = httpAdapter.getInstance();

  const port = configService.get<number>('app.port', 3000);

  // API application routes will become:
  // /api/v1/...
  //
  // Better Auth is intentionally NOT placed under this prefix.
  // Better Auth uses:
  // /api/auth/...
  const apiPrefix = configService.get<string>(
    'app.apiPrefix',
    'api/v1',
  );

  const corsOrigins = configService.get<string[]>(
    'security.corsOrigins',
    [
      'http://localhost:5173',
      'http://localhost:3001',
    ],
  );

  const isProduction = configService.get<boolean>(
    'app.isProduction',
    false,
  );

  // ============================================================
  // 1. HTTP SECURITY HEADERS
  // ============================================================

  expressApp.use(
    helmet({
      contentSecurityPolicy: isProduction
        ? {
          directives: {
            defaultSrc: ["'self'"],

            // NOTE:
            // unsafe-inline is commonly required by Swagger UI
            // and some frontend tooling. If the production API
            // does not serve browser UI, this can potentially
            // be tightened later.
            styleSrc: ["'self'", "'unsafe-inline'"],

            imgSrc: ["'self'", 'data:', 'https:'],

            scriptSrc: ["'self'"],

            connectSrc: [
              "'self'",
              'https:',
              'http:',
              'ws:',
              'wss:',
            ],
          },
        }
        : false,

      crossOriginEmbedderPolicy: isProduction,

      crossOriginResourcePolicy: {
        policy: 'cross-origin',
      },

      // HSTS should only be used with an HTTPS-ready production
      // deployment.
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },

      frameguard: {
        action: 'deny',
      },

      noSniff: true,

      referrerPolicy: {
        policy: 'strict-origin-when-cross-origin',
      },
    }),
  );

  // ============================================================
  // 2. CORS
  // ============================================================

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (
        err: Error | null,
        allow?: boolean,
      ) => void,
    ) => {
      // Requests without an Origin header are not browser CORS
      // requests. They can come from curl, Postman, server-to-server
      // requests, etc.
      if (!origin) {
        return callback(null, true);
      }

      // Explicit allowlist only.
      //
      // Do not allow "*" with credentials:true because authentication
      // uses cookies.
      const isAllowed = corsOrigins.some(
        (allowed) =>
          allowed === origin ||
          allowed === origin.replace(/\/$/, ''),
      );

      if (isAllowed) {
        return callback(null, true);
      }

      logger.warn(
        `CORS policy blocked request from origin: ${origin}`,
      );

      return callback(null, false);
    },

    credentials: true,

    methods: [
      'GET',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
      'OPTIONS',
    ],

    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-correlation-id',
      'x-request-id',
    ],

    exposedHeaders: [
      'x-correlation-id',
    ],

    maxAge: 86400,
  });

  // ============================================================
  // 3. BETTER AUTH ROUTES
  // ============================================================

  // Better Auth is mounted directly on the underlying Express
  // application.
  //
  // IMPORTANT:
  // This must be registered BEFORE Express body parsers.
  //
  // Better Auth routes include:
  //
  //   POST /api/auth/sign-in/email
  //   POST /api/auth/sign-up/email
  //   GET  /api/auth/get-session
  //   POST /api/auth/sign-out
  //   etc.
  expressApp.all(
    '/api/auth/*splat',
    toNodeHandler(auth),
  );

  // ============================================================
  // 4. REQUEST BODY SIZE LIMITS
  // ============================================================

  // bodyParser:false was enabled when creating the Nest application,
  // so we manually register Express parsers for normal NestJS routes.
  //
  // 1 MB JSON limit keeps normal API payloads relatively small.
  // URL-encoded requests are allowed a larger limit for now.
  expressApp.use(
    express.json({
      limit: '1mb',
    }),
  );

  expressApp.use(
    express.urlencoded({
      extended: true,
      limit: '10mb',
    }),
  );

  // ============================================================
  // 5. API ROUTING PREFIX
  // ============================================================

  // NestJS application API:
  //
  //   /api/v1/users
  //   /api/v1/...
  //
  // Better Auth remains:
  //
  //   /api/auth/...
  //
  // This separation is intentional.
  app.setGlobalPrefix(apiPrefix, {
    exclude: [
      '/',
      '',
      'health',
      'health/live',
    ],
  });

  // ============================================================
  // 6. GLOBAL VALIDATION
  // ============================================================

  // Strict DTO validation for NestJS controllers.
  //
  // Better Auth's directly mounted handler has its own request
  // validation and does not depend on Nest's validation pipe.
  app.useGlobalPipes(
    new AppValidationPipe(),
  );

  // ============================================================
  // 7. GRACEFUL SHUTDOWN
  // ============================================================

  app.enableShutdownHooks();

  // ============================================================
  // 8. SWAGGER / OPENAPI
  // ============================================================

  if (!isProduction) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Enterprise NestJS API')
      .setDescription(
        'Production-grade NestJS REST API with PostgreSQL, Prisma, Better Auth, and defense-in-depth security.',
      )
      .setVersion('1.0.0')

      // Better Auth uses session-based authentication.
      // The session cookie is the primary browser authentication
      // mechanism.
      .addCookieAuth(
        'better-auth.session_token',
        {
          type: 'apiKey',
          in: 'cookie',
          description:
            'Better Auth session cookie used for authenticated requests.',
        },
      )

      .addTag('Health & Monitoring')
      .addTag('Authentication')
      .addTag('Users')
      .build();

    const document = SwaggerModule.createDocument(
      app,
      swaggerConfig,
    );

    SwaggerModule.setup(
      'api/docs',
      app,
      document,
      {
        swaggerOptions: {
          persistAuthorization: true,
        },
      },
    );

    logger.log(
      `Swagger documentation available at: http://localhost:${port}/api/docs`,
    );
  }

  // ============================================================
  // 9. START SERVER
  // ============================================================

  await app.listen(port);

  logger.log(
    `🚀 Application is running on: http://localhost:${port}/${apiPrefix}`,
  );

  logger.log(
    `🔐 Better Auth available at: http://localhost:${port}/api/auth`,
  );
}

// ============================================================
// APPLICATION BOOTSTRAP ERROR
// ============================================================

bootstrap().catch((err) => {
  console.error(
    'Fatal application bootstrap failure:',
    err,
  );

  process.exit(1);
});
