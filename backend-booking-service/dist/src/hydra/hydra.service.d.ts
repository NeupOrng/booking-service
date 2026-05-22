import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AcceptOAuth2ConsentRequest, AcceptOAuth2LoginRequest } from '@ory/client';
export declare class HydraService implements OnModuleInit {
    private readonly config;
    private admin;
    constructor(config: ConfigService);
    onModuleInit(): void;
    getLoginRequest(loginChallenge: string): Promise<import("@ory/client").OAuth2LoginRequest>;
    acceptLoginRequest(loginChallenge: string, body: AcceptOAuth2LoginRequest): Promise<import("@ory/client").OAuth2RedirectTo>;
    rejectLoginRequest(loginChallenge: string, error?: string, description?: string): Promise<import("@ory/client").OAuth2RedirectTo>;
    getConsentRequest(consentChallenge: string): Promise<import("@ory/client").OAuth2ConsentRequest>;
    acceptConsentRequest(consentChallenge: string, body: AcceptOAuth2ConsentRequest): Promise<import("@ory/client").OAuth2RedirectTo>;
    rejectConsentRequest(consentChallenge: string, error?: string, description?: string): Promise<import("@ory/client").OAuth2RedirectTo>;
    getLogoutRequest(logoutChallenge: string): Promise<import("@ory/client").OAuth2LogoutRequest>;
    acceptLogoutRequest(logoutChallenge: string): Promise<import("@ory/client").OAuth2RedirectTo>;
    rejectLogoutRequest(logoutChallenge: string): Promise<void>;
    private handleError;
}
