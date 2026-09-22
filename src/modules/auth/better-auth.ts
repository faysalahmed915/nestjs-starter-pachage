import { betterAuth } from 'better-auth';
import { prismaAdapter } from '@better-auth/prisma-adapter';

import type { ConfigType } from '@nestjs/config';

import type { PrismaService } from '../../core/database/prisma.service.js';
import { authConfig } from '../../config/auth.config.js';

export const createBetterAuth = (
  prisma: PrismaService,
  config: ConfigType<typeof authConfig>,
) => {
  return betterAuth({
    database: prismaAdapter(prisma, {
      provider: 'postgresql',
    }),

    secret: config.secret,
    baseURL: config.url,
    basePath: config.basePath,
    trustedOrigins: config.trustedOrigins,

    emailAndPassword: {
      enabled: true,
    },

    user: {
      additionalFields: {
        role: {
          type: 'string',
          required: false,
          defaultValue: 'user',
          input: false,
        },
      },
    },

    advanced: {
      database: {
        joins: true,
      },
    },
  });
};

export type Auth = ReturnType<typeof createBetterAuth>;