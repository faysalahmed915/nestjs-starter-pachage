import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  CORRELATION_ID_HEADER,
  REQUEST_ID_HEADER,
} from '../constants/security.constants.js';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const existingId =
      (req.headers[CORRELATION_ID_HEADER] as string) ||
      (req.headers[REQUEST_ID_HEADER] as string);

    const correlationId = existingId || uuidv4();

    // Attach to request object for use across interceptors/filters
    (req as Request & { correlationId: string }).correlationId = correlationId;

    // Propagate on response headers
    res.setHeader(CORRELATION_ID_HEADER, correlationId);

    next();
  }
}
