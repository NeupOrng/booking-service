import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AcceptOAuth2ConsentRequest,
  AcceptOAuth2LoginRequest,
  Configuration,
  OAuth2Api,
} from '@ory/client';

@Injectable()
export class HydraService implements OnModuleInit {
  private admin: OAuth2Api;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    this.admin = new OAuth2Api(
      new Configuration({ basePath: this.config.get<string>('hydra.adminUrl') }),
    );
  }

  // ── Login ──────────────────────────────────────────────────────────────────

  async getLoginRequest(loginChallenge: string) {
    try {
      const { data } = await this.admin.getOAuth2LoginRequest({ loginChallenge });
      return data;
    } catch (e) {
      this.handleError(e, 'Login challenge');
    }
  }

  async acceptLoginRequest(loginChallenge: string, body: AcceptOAuth2LoginRequest) {
    const { data } = await this.admin.acceptOAuth2LoginRequest({
      loginChallenge,
      acceptOAuth2LoginRequest: body,
    });
    return data;
  }

  async rejectLoginRequest(loginChallenge: string, error = 'access_denied', description = 'The user denied the login request') {
    const { data } = await this.admin.rejectOAuth2LoginRequest({
      loginChallenge,
      rejectOAuth2Request: { error, error_description: description },
    });
    return data;
  }

  // ── Consent ────────────────────────────────────────────────────────────────

  async getConsentRequest(consentChallenge: string) {
    try {
      const { data } = await this.admin.getOAuth2ConsentRequest({ consentChallenge });
      return data;
    } catch (e) {
      this.handleError(e, 'Consent challenge');
    }
  }

  async acceptConsentRequest(consentChallenge: string, body: AcceptOAuth2ConsentRequest) {
    const { data } = await this.admin.acceptOAuth2ConsentRequest({
      consentChallenge,
      acceptOAuth2ConsentRequest: body,
    });
    return data;
  }

  async rejectConsentRequest(consentChallenge: string, error = 'access_denied', description = 'The user denied the consent request') {
    const { data } = await this.admin.rejectOAuth2ConsentRequest({
      consentChallenge,
      rejectOAuth2Request: { error, error_description: description },
    });
    return data;
  }

  // ── Logout ─────────────────────────────────────────────────────────────────

  async getLogoutRequest(logoutChallenge: string) {
    try {
      const { data } = await this.admin.getOAuth2LogoutRequest({ logoutChallenge });
      return data;
    } catch (e) {
      this.handleError(e, 'Logout challenge');
    }
  }

  async acceptLogoutRequest(logoutChallenge: string) {
    const { data } = await this.admin.acceptOAuth2LogoutRequest({ logoutChallenge });
    return data;
  }

  async rejectLogoutRequest(logoutChallenge: string) {
    await this.admin.rejectOAuth2LogoutRequest({ logoutChallenge });
  }

  // ── Internals ──────────────────────────────────────────────────────────────

  private handleError(error: any, label: string): never {
    const status = error?.response?.status;
    if (status === 404 || status === 410) {
      throw new BadRequestException(`${label} is invalid or has expired`);
    }
    throw error;
  }
}
