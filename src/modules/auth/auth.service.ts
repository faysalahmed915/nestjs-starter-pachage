import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service.js';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator.js';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Validates a session token against the database session store.
   * Ready for Better-Auth schema integration.
   */
  async validateSession(token: string): Promise<AuthenticatedUser | null> {
    try {
      // Lookup session in Prisma PostgreSQL store
      const session = await this.prisma.session.findUnique({
        where: { token },
        include: { user: true },
      });

      if (!session) {
        return null;
      }

      // Check expiration
      if (session.expiresAt < new Date()) {
        await this.prisma.session.delete({ where: { id: session.id } }).catch(() => null);
        return null;
      }

      return {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
      };
    } catch (error) {
      // In development or when DB is not yet running, log warning
      this.logger.warn(`Session validation query deferred: ${(error as Error).message}`);
      return null;
    }
  }

  /**
   * Placeholder hook for Better-Auth native route handler delegation
   */
  getBetterAuthInstance() {
    // See docs/BETTER_AUTH_GUIDE.md for complete drop-in instructions
    return null;
  }
}
