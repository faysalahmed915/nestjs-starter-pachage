import { Injectable, Inject } from '@nestjs/common';
import { fromNodeHeaders } from 'better-auth/node';
import type { IncomingHttpHeaders } from 'node:http';

import { BETTER_AUTH } from './auth.constants.js';
import type { Auth } from './better-auth.js';

@Injectable()
export class AuthService {
  constructor(
    @Inject(BETTER_AUTH)
    private readonly auth: Auth,
  ) {}

  get instance(): Auth {
    return this.auth;
  }

  get api() {
    return this.auth.api;
  }

  async getSession(headers: IncomingHttpHeaders | Headers) {
    const parsedHeaders =
      headers instanceof Headers ? headers : fromNodeHeaders(headers);

    return this.auth.api.getSession({
      headers: parsedHeaders,
    });
  }
}
