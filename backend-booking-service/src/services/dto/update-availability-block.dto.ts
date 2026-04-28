import { PartialType } from '@nestjs/swagger';
import { CreateAvailabilityBlockDto } from './create-availability-block.dto';

export class UpdateAvailabilityBlockDto extends PartialType(CreateAvailabilityBlockDto) {}
