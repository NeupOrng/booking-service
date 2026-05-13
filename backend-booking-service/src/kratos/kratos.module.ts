import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  OryFrontendModule,
  OryIdentitiesModule,
} from '@getlarge/kratos-client-wrapper';
import { KratosFrontendService } from './kratos-frontend.service';
import { KratosIdentitiesService } from './kratos-identities.service';
import { KratosAuthController } from './kratos-auth.controller';

@Module({
  imports: [
    ConfigModule,

    OryFrontendModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        basePath: configService.get<string>('kratos.publicUrl')!,
      }),
    }),

    OryIdentitiesModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        basePath: configService.get<string>('kratos.adminUrl')!,
      }),
    }),
  ],
  controllers: [KratosAuthController],
  providers: [KratosFrontendService, KratosIdentitiesService],
  exports: [KratosFrontendService, KratosIdentitiesService, OryFrontendModule, OryIdentitiesModule],
})
export class KratosModule {}