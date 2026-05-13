import {
  Body,
  Controller,
  Get,
  HttpException,
  InternalServerErrorException,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { isOryError } from '@getlarge/kratos-client-wrapper';
import { UpdateLoginFlowBody, UpdateRegistrationFlowBody } from '@ory/client';
import { Request, Response } from 'express';
import { KratosFrontendService } from './kratos-frontend.service';

const SESSION_COOKIE = 'ory_kratos_session';
const IS_PROD = process.env.NODE_ENV === 'production';

function setSessionCookie(res: Response, token: string, expiresAt?: string): void {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: IS_PROD ? 'strict' : 'lax',
    expires: expiresAt ? new Date(expiresAt) : undefined,
  });
}

function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE);
}

function toHttpException(error: unknown): HttpException {
  if (isOryError(error)) {
    const status = (error as any).response?.status ?? 500;
    const data = (error as any).response?.data ?? { message: (error as any).message ?? 'Kratos error' };
    return new HttpException(data, status);
  }
  if (error instanceof Error) {
    return new InternalServerErrorException(error.message);
  }
  return new InternalServerErrorException();
}

function resolveToken(req: Request): string | undefined {
  // 1. HttpOnly cookie (set by this proxy after login/registration)
  if (req.cookies?.[SESSION_COOKIE]) return req.cookies[SESSION_COOKIE];
  // 2. Explicit header (native clients / mobile)
  const header = req.headers['x-session-token'] as string | undefined;
  if (header) return header;
  // 3. Bearer token
  const bearer = req.headers['authorization'];
  if (bearer?.startsWith('Bearer ')) return bearer.slice(7);
  return undefined;
}

@ApiTags('auth/kratos')
@Controller('auth/kratos')
export class KratosAuthController {
  constructor(private readonly kratosFrontend: KratosFrontendService) {}

  // ── Login ──────────────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Initialize a native login flow' })
  @Get('login/flow')
  async initLoginFlow() {
    try {
      const response = await this.kratosFrontend.createLoginFlow();
      return response.data;
    } catch (e) {
      throw toHttpException(e);
    }
  }

  @ApiOperation({ summary: 'Get login flow by ID' })
  @Get('login/flows')
  async getLoginFlow(@Query('id') id: string) {
    try {
      const response = await this.kratosFrontend.getLoginFlow(id);
      return response.data;
    } catch (e) {
      throw toHttpException(e);
    }
  }

  @ApiOperation({ summary: 'Submit a login flow' })
  @Post('login')
  async submitLoginFlow(
    @Query('flow') flowId: string,
    @Body() body: UpdateLoginFlowBody,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const response = await this.kratosFrontend.submitLoginFlow(flowId, body, resolveToken(req));
      const { session_token, session, identity } = response.data;
      if (session_token) {
        setSessionCookie(res, session_token, session?.expires_at);
      }
      return { session, identity };
    } catch (e) {
      throw toHttpException(e);
    }
  }

  // ── Registration ───────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Initialize a native registration flow' })
  @Get('registration/flow')
  async initRegistrationFlow() {
    try {
      const response = await this.kratosFrontend.createRegistrationFlow();
      return response.data;
    } catch (e) {
      throw toHttpException(e);
    }
  }

  @ApiOperation({ summary: 'Get registration flow by ID' })
  @Get('registration/flows')
  async getRegistrationFlow(@Query('id') id: string) {
    try {
      const response = await this.kratosFrontend.getRegistrationFlow(id);
      return response.data;
    } catch (e) {
      throw toHttpException(e);
    }
  }

  @ApiOperation({ summary: 'Submit a registration flow' })
  @Post('registration')
  async submitRegistrationFlow(
    @Query('flow') flowId: string,
    @Body() body: UpdateRegistrationFlowBody,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const response = await this.kratosFrontend.submitRegistrationFlow(flowId, body);
      const { session_token, session, identity } = response.data;
      if (session_token) {
        setSessionCookie(res, session_token, session?.expires_at);
      }
      return { session, identity };
    } catch (e) {
      throw toHttpException(e);
    }
  }

  // ── Session ────────────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Return the current session (whoami)' })
  @Get('sessions/whoami')
  async whoami(@Req() req: Request) {
    try {
      const response = await this.kratosFrontend.getSession(resolveToken(req));
      return response.data;
    } catch (e) {
      throw toHttpException(e);
    }
  }

  // ── Logout ─────────────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Invalidate the current session' })
  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = resolveToken(req);
    if (!token) throw new HttpException({ message: 'No active session' }, 400);
    try {
      await this.kratosFrontend.logout(token);
      clearSessionCookie(res);
      return { message: 'Logged out' };
    } catch (e) {
      throw toHttpException(e);
    }
  }
}
