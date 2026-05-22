import {
    BadRequestException,
    Body,
    Controller,
    Get,
    Logger,
    Post,
    Query,
    Req,
    Res,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { HydraService } from './hydra.service';
import { LoginChallengeDto } from './dto/login-challenge.dto';
import { ConsentAcceptDto } from './dto/consent-accept.dto';
import { KratosFrontendService } from '../kratos/kratos-frontend.service';
import { KratosIdentitiesService } from '../kratos/kratos-identities.service';

const SESSION_COOKIE = 'ory_kratos_session';

@ApiTags('oauth')
@Controller('oauth')
export class HydraOAuthController {
    private readonly frontendUrl: string;

    constructor(
        private readonly hydra: HydraService,
        private readonly kratosFrontend: KratosFrontendService,
        private readonly kratosIdentities: KratosIdentitiesService,
        private readonly config: ConfigService,
    ) {
        this.frontendUrl =
            config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
    }

    // ── Login ──────────────────────────────────────────────────────────────────

    @ApiOperation({
        summary:
            'Hydra login redirect handler — skip or redirect to frontend login',
    })
    @Get('login')
    async oauthLogin(
        @Query('login_challenge') challenge: string,
        @Res() res: Response,
    ) {
        if (!challenge)
            throw new BadRequestException('login_challenge is required');

        const loginReq = await this.hydra.getLoginRequest(challenge);

        if (loginReq.skip) {
            const accepted = await this.hydra.acceptLoginRequest(challenge, {
                subject: loginReq.subject,
            });
            return res.redirect(accepted.redirect_to);
        }

        return res.redirect(
            `${this.frontendUrl}/auth/login?login_challenge=${challenge}`,
        );
    }

    @ApiOperation({
        summary: 'Accept Hydra login after successful Kratos authentication',
    })
    @Post('login')
    async completeLogin(@Body() dto: LoginChallengeDto, @Req() req: Request) {
        const token = req.cookies?.[SESSION_COOKIE];
        Logger.log(`[OAuth] token ${token}`);
        if (!token) {
            throw new BadRequestException(
                'No active Kratos session. Complete login first.',
            );
        }

        const { data: session } = await this.kratosFrontend.getSession(token);
        Logger.log(`[OAuth] session ${JSON.stringify(session)}`);
        if (!session?.active || !session?.identity?.id) {
            throw new BadRequestException(
                'Kratos session is inactive or missing identity',
            );
        }
        Logger.log(`[OAuth] dto ${JSON.stringify(dto)}`);
        const accepted = await this.hydra.acceptLoginRequest(
            dto.login_challenge,
            {
                subject: session.identity.id,
                remember: true,
                remember_for: 3600,
            },
        );

        return { redirect_to: accepted.redirect_to };
    }

    // ── Consent ────────────────────────────────────────────────────────────────

    @ApiOperation({
        summary:
            'Hydra consent redirect handler — skip or redirect to frontend consent page',
    })
    @Get('consent')
    async oauthConsent(
        @Query('consent_challenge') challenge: string,
        @Res() res: Response,
    ) {
        if (!challenge)
            throw new BadRequestException('consent_challenge is required');

        const consentReq = await this.hydra.getConsentRequest(challenge);

        if (consentReq.skip) {
            const accepted = await this.hydra.acceptConsentRequest(challenge, {
                grant_scope: consentReq.requested_scope ?? [],
                grant_access_token_audience:
                    consentReq.requested_access_token_audience ?? [],
                remember: true,
                remember_for: 3600,
            });
            return res.redirect(accepted.redirect_to);
        }

        return res.redirect(
            `${this.frontendUrl}/auth/consent?consent_challenge=${challenge}`,
        );
    }

    @ApiOperation({
        summary: 'Accept consent — called by frontend after user grants scopes',
    })
    @Post('consent')
    async acceptConsent(@Body() dto: ConsentAcceptDto) {
        const consentReq = await this.hydra.getConsentRequest(
            dto.consent_challenge,
        );

        const idTokenClaims: Record<string, any> = {};
        if (consentReq.subject) {
            try {
                const identity = await this.kratosIdentities.getIdentity(
                    consentReq.subject,
                );
                const traits = identity.traits as Record<string, any>;
                if (traits?.email) idTokenClaims['email'] = traits.email;
                if (traits?.full_name) idTokenClaims['name'] = traits.full_name;
            } catch {
                // non-critical — proceed without extra claims
            }
        }

        const accepted = await this.hydra.acceptConsentRequest(
            dto.consent_challenge,
            {
                grant_scope: dto.grant_scopes,
                grant_access_token_audience:
                    consentReq.requested_access_token_audience ?? [],
                remember: dto.remember,
                remember_for: dto.remember_for ?? 3600,
                session: { id_token: idTokenClaims },
            },
        );

        return { redirect_to: accepted.redirect_to };
    }

    // ── Consent info (for frontend rendering) ─────────────────────────────────

    @ApiOperation({
        summary: 'Return consent request details for the frontend consent page',
    })
    @Get('consent/info')
    async consentInfo(@Query('consent_challenge') challenge: string) {
        if (!challenge)
            throw new BadRequestException('consent_challenge is required');

        const consentReq = await this.hydra.getConsentRequest(challenge);

        return {
            consent_challenge: challenge,
            requested_scope: consentReq.requested_scope ?? [],
            client: {
                client_id: consentReq.client?.client_id,
                client_name:
                    consentReq.client?.client_name ??
                    consentReq.client?.client_id,
                logo_uri: consentReq.client?.logo_uri ?? null,
                policy_uri: consentReq.client?.policy_uri ?? null,
                tos_uri: consentReq.client?.tos_uri ?? null,
            },
        };
    }

    // ── Logout ─────────────────────────────────────────────────────────────────

    @ApiOperation({
        summary: 'Hydra logout handler — revoke session and redirect',
    })
    @Get('logout')
    async oauthLogout(
        @Query('logout_challenge') challenge: string,
        @Res() res: Response,
    ) {
        if (!challenge)
            throw new BadRequestException('logout_challenge is required');

        await this.hydra.getLogoutRequest(challenge);
        const accepted = await this.hydra.acceptLogoutRequest(challenge);

        res.clearCookie(SESSION_COOKIE);
        return res.redirect(accepted.redirect_to);
    }
}
