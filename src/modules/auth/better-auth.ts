import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';

import type { ConfigType } from '@nestjs/config';

import type { PrismaService } from '../../core/database/prisma.service.js';
import { authConfig } from '../../config/auth.config.js';

export const createBetterAuth = (
    prisma: PrismaService,
    config: ConfigType<typeof authConfig>,
) => {
    return betterAuth({
        // ============================================================
        // DATABASE
        // ============================================================

        // SECURITY / ARCHITECTURE:
        // Reuse the PrismaService already managed by NestJS.
        //
        // We do NOT create another PrismaClient here.
        database: prismaAdapter(prisma, {
            provider: 'postgresql',
        }),

        // ============================================================
        // CORE AUTH CONFIGURATION
        // ============================================================

        // Comes from validated ConfigModule configuration.
        // No hard-coded secret and no insecure fallback.
        secret: config.secret,

        // Canonical server URL.
        baseURL: config.url,

        // SINGLE SOURCE OF TRUTH:
        // /api/auth
        basePath: config.basePath,

        // SECURITY:
        // Explicit list of browser origins that Better Auth trusts.
        //
        // No wildcard.
        trustedOrigins: config.trustedOrigins,

        // ============================================================
        // EMAIL + PASSWORD AUTHENTICATION
        // ============================================================

        emailAndPassword: {
            enabled: true,
        },

        // ============================================================
        // DATABASE OPTIMIZATION
        // ============================================================

        advanced: {
            database: {
                // Better Auth's Prisma adapter supports joins.
                // This can reduce database round trips for related queries.
                joins: true,
            },

            // IMPORTANT:
            // We intentionally do NOT disable CSRF or origin checking.
            //
            // Better Auth's secure defaults should remain enabled.
            //
            // disableCSRFCheck: false,
            // disableOriginCheck: false,
        },
    });
};