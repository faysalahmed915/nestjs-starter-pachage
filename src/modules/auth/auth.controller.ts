import { Controller, Get, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
} from '@nestjs/swagger';
import type { Request } from 'express';

import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator.js';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  @Get('me')
  @ApiCookieAuth('better-auth.session_token')
  @ApiOperation({
    summary: 'Get current authenticated user profile & session info',
  })
  @ApiResponse({
    status: 200,
    description: 'Current session user profile retrieved successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing session cookie.',
  })
  getMe(@CurrentUser() user: AuthenticatedUser, @Req() req: Request) {
    return {
      user,
      session: (req as any).session,
    };
  }
}
