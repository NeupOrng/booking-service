import { Injectable } from '@nestjs/common';
import { OryIdentitiesService } from '@getlarge/kratos-client-wrapper';
import { CreateIdentityBody, Identity, UpdateIdentityBody } from '@ory/client';

@Injectable()
export class KratosIdentitiesService {
  constructor(private readonly oryIdentities: OryIdentitiesService) {}

  async getIdentity(id: string): Promise<Identity> {
    const { data } = await this.oryIdentities.getIdentity({ id });
    return data;
  }

  async createIdentity(body: CreateIdentityBody): Promise<Identity> {
    const { data } = await this.oryIdentities.createIdentity({ createIdentityBody: body });
    return data;
  }

  async updateIdentity(id: string, body: UpdateIdentityBody): Promise<Identity> {
    const { data } = await this.oryIdentities.updateIdentity({ id, updateIdentityBody: body });
    return data;
  }

  async deleteIdentity(id: string): Promise<void> {
    await this.oryIdentities.deleteIdentity({ id });
  }

  async deleteIdentitySessions(id: string): Promise<void> {
    await this.oryIdentities.deleteIdentitySessions({ id });
  }
}
