import { OryIdentitiesService } from '@getlarge/kratos-client-wrapper';
import { CreateIdentityBody, Identity, UpdateIdentityBody } from '@ory/client';
export declare class KratosIdentitiesService {
    private readonly oryIdentities;
    constructor(oryIdentities: OryIdentitiesService);
    getIdentity(id: string): Promise<Identity>;
    createIdentity(body: CreateIdentityBody): Promise<Identity>;
    updateIdentity(id: string, body: UpdateIdentityBody): Promise<Identity>;
    deleteIdentity(id: string): Promise<void>;
    deleteIdentitySessions(id: string): Promise<void>;
}
