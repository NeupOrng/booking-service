import { ConfigService } from '@nestjs/config';
declare const JwtStrategy_base: new (...args: unknown[]) => any;
export declare class JwtStrategy extends JwtStrategy_base {
    constructor(configService: ConfigService);
    validate(payload: {
        sub: string;
        role: string;
    }): Promise<{
        id: string;
        role: string;
    }>;
}
export {};
