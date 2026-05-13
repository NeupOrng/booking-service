import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Session } from '@ory/client';

export const KratosSession = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Session => {
    const req = ctx.switchToHttp().getRequest();
    return req.kratosSession;
  },
);
