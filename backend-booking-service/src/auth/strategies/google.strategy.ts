import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('oauth.google.clientID') || 'fallback-client-id',
      clientSecret: configService.get<string>('oauth.google.clientSecret') || 'fallback-client-secret',
      callbackURL: configService.get<string>('oauth.google.callbackURL') || 'http://localhost:3000/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const email = profile.emails[0].value;
    const fullName = profile.displayName;
    const avatarUrl = profile.photos && profile.photos[0] ? profile.photos[0].value : undefined;

    const user = await this.authService.findOrCreateOAuthUser('google', profile.id, {
      email,
      fullName,
      avatarUrl,
    });
    
    done(null, user);
  }
}
