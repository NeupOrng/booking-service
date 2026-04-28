import { Module } from '@nestjs/common';
import { CategoriesModule } from '../categories/categories.module';
import { BusinessesController } from './businesses.controller';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
import { ServicesRepository } from './services.repository';
import { AvailabilityService } from './availability.service';

@Module({
  imports: [CategoriesModule],
  controllers: [BusinessesController, ServicesController],
  providers: [ServicesService, AvailabilityService, ServicesRepository],
  exports: [ServicesService],
})
export class ServicesModule { }
