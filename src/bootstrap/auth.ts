import type { INestApplication } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { toNodeHandler } from 'better-auth/node';

import { BETTER_AUTH } from '../modules/auth/auth.constants.js';

/**
 * Mounts Better Auth routes directly on the underlying Express application.
 *
 * CRITICAL ARCHITECTURE RULE:
 * Better Auth's Node handler MUST receive the request before Express body parsers
 * consume the incoming request body stream. Therefore, setupAuth() must be called
 * before setupHttp() registers express.json() and express.urlencoded().
 */
export function setupAuth(app: INestApplication, authInstance?: any): void {
  const logger = new Logger('BootstrapAuth');
  const configService = app.get(ConfigService);
  const authBasePath = configService.get<string>('auth.basePath', '/api/auth');

  const httpAdapter = app.getHttpAdapter();
  const expressApp = httpAdapter.getInstance();

  const auth = authInstance ?? app.get(BETTER_AUTH, { strict: false });

  if (auth) {
    expressApp.all(`${authBasePath}/*splat`, toNodeHandler(auth));
    logger.log(`🔐 Better Auth mounted at: ${authBasePath}`);
    return;
  }

  logger.warn(
    `Better Auth handler deferred: ready to mount at ${authBasePath}/*splat once auth module is finalized.`,
  );
}
