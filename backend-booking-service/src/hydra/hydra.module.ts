import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HydraService } from './hydra.service';
import { HydraOAuthController } from './hydra-oauth.controller';
import { KratosModule } from '../kratos/kratos.module';

@Module({
  imports: [ConfigModule, KratosModule],
  controllers: [HydraOAuthController],
  providers: [HydraService],
  exports: [HydraService],
})
export class HydraModule {}
