import { Injectable } from '@nestjs/common';
import { OryFrontendService } from '@getlarge/kratos-client-wrapper';
import { UpdateLoginFlowBody, UpdateRegistrationFlowBody } from '@ory/client';

@Injectable()
export class KratosFrontendService {
  constructor(private readonly oryFrontend: OryFrontendService) {}

  // ── Login ──────────────────────────────────────────────────────────────────

  async createLoginFlow(): Promise<any> {
    return this.oryFrontend.createNativeLoginFlow();
  }

  async getLoginFlow(id: string): Promise<any> {
    return this.oryFrontend.getLoginFlow({ id });
  }

  async submitLoginFlow(
    flowId: string,
    body: UpdateLoginFlowBody,
    xSessionToken?: string,
  ): Promise<any> {
    return this.oryFrontend.updateLoginFlow({
      flow: flowId,
      updateLoginFlowBody: body,
      xSessionToken,
    });
  }

  // ── Registration ───────────────────────────────────────────────────────────

  async createRegistrationFlow(): Promise<any> {
    return this.oryFrontend.createNativeRegistrationFlow();
  }

  async getRegistrationFlow(id: string): Promise<any> {
    return this.oryFrontend.getRegistrationFlow({ id });
  }

  async submitRegistrationFlow(
    flowId: string,
    body: UpdateRegistrationFlowBody,
  ): Promise<any> {
    return this.oryFrontend.updateRegistrationFlow({
      flow: flowId,
      updateRegistrationFlowBody: body,
    });
  }

  // ── Session ────────────────────────────────────────────────────────────────

  async getSession(xSessionToken?: string): Promise<any> {
    return this.oryFrontend.toSession({ xSessionToken });
  }

  // ── Logout ─────────────────────────────────────────────────────────────────

  async logout(sessionToken: string): Promise<any> {
    return this.oryFrontend.performNativeLogout({
      performNativeLogoutBody: { session_token: sessionToken },
    });
  }
}
