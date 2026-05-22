/// <reference types="cookie-parser" />
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { HydraService } from './hydra.service';
import { LoginChallengeDto } from './dto/login-challenge.dto';
import { ConsentAcceptDto } from './dto/consent-accept.dto';
import { KratosFrontendService } from '../kratos/kratos-frontend.service';
import { KratosIdentitiesService } from '../kratos/kratos-identities.service';
export declare class HydraOAuthController {
    private readonly hydra;
    private readonly kratosFrontend;
    private readonly kratosIdentities;
    private readonly config;
    private readonly frontendUrl;
    constructor(hydra: HydraService, kratosFrontend: KratosFrontendService, kratosIdentities: KratosIdentitiesService, config: ConfigService);
    oauthLogin(challenge: string, res: Response): Promise<void>;
    completeLogin(dto: LoginChallengeDto, req: Request): Promise<{
        redirect_to: string;
    }>;
    oauthConsent(challenge: string, res: Response): Promise<void>;
    acceptConsent(dto: ConsentAcceptDto): Promise<{
        redirect_to: string;
    }>;
    consentInfo(challenge: string): Promise<{
        consent_challenge: string;
        requested_scope: string[];
        client: {
            client_id: string;
            client_name: string;
            logo_uri: string;
            policy_uri: string;
            tos_uri: string;
        };
    }>;
    oauthLogout(challenge: string, res: Response): Promise<void>;
}
