import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      clientID:    configService.get<string>('oauth.google.clientID'),
      clientSecret: configService.get<string>('oauth.google.clientSecret'),
      callbackURL:  configService.get<string>('oauth.google.callbackURL') || process.env.GOOGLE_CALLBACK_URL,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<void> {
    const email     = profile.emails?.[0]?.value;
    const fullName  = profile.displayName;
    const avatarUrl = profile.photos?.[0]?.value;

    const user = await this.usersService.findOrCreateOAuth('google', profile.id, {
      email,
      fullName,
      avatarUrl,
    });

    done(null, user);
  }
}
