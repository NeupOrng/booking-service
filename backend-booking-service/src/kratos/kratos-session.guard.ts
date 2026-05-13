import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { OryAuthenticationGuard } from '@getlarge/kratos-client-wrapper';
import type { Session } from '@ory/client';
import type { Request } from 'express';

const KRATOS_SESSION_KEY = 'kratosSession';

export const KratosSessionGuard = OryAuthenticationGuard({
  cookieResolver: (ctx: ExecutionContext) => {
    const req: Request = ctx.switchToHttp().getRequest();
    return req.headers['cookie'] ?? '';
  },

  sessionTokenResolver: (ctx: ExecutionContext) => {
    const req: Request = ctx.switchToHttp().getRequest();
    const header = req.headers['x-session-token'] as string | undefined;
    if (header) return header;
    const bearer = req.headers['authorization'];
    if (bearer?.startsWith('Bearer ')) return bearer.slice(7);
    return '';
  },

  isValidSession: (session: Session) => {
    return session.active === true;
  },

  postValidationHook: (ctx: ExecutionContext, session: Session) => {
    const req: Request = ctx.switchToHttp().getRequest();
    (req as any)[KRATOS_SESSION_KEY] = session;
  },

  unauthorizedFactory: (_ctx: ExecutionContext, error: unknown) => {
    const message =
      error instanceof Error ? error.message : 'Invalid or missing Kratos session';
    return new UnauthorizedException(message);
  },
});
