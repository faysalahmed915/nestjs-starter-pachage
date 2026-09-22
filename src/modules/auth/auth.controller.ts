import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator.js';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../common/decorators/current-user.decorator.js';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  // Stricter rate limit for authentication endpoints to prevent brute-force attacks
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Authenticate user with email and password (brute-force protected)',
  })
  @ApiResponse({ status: 200, description: 'Authentication successful' })
  @ApiResponse({ status: 400, description: 'Invalid payload' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async login(@Body() loginDto: LoginDto) {
    return {
      message:
        'Starter placeholder: To activate full session management, see docs/BETTER_AUTH_GUIDE.md',
      submittedEmail: loginDto.email,
    };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiResponse({ status: 201, description: 'User registration initiated' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  async register(@Body() registerDto: RegisterDto) {
    return {
      message: 'User registration scaffolded. Ready for Prisma + Better-Auth integration.',
      email: registerDto.email,
      name: registerDto.name,
    };
  }

  @ApiBearerAuth('JWT-auth')
  @Get('me')
  @ApiOperation({ summary: 'Retrieve the profile of the currently authenticated user' })
  @ApiResponse({ status: 200, description: 'User profile returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getProfile(@CurrentUser() user: AuthenticatedUser) {
    return {
      user,
    };
  }

  @Public()
  @Get('status')
  @ApiOperation({ summary: 'Check authentication subsystem status' })
  status() {
    return {
      status: 'active',
      adapter: 'prisma-postgresql',
      authEngine: 'better-auth-ready',
    };
  }
}
