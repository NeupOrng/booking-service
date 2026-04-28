import { Global, Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { FilesRepository } from './files.repository';
import { MinioService } from './minio.service';

@Global()
@Module({
  controllers: [FilesController],
  providers: [FilesService, FilesRepository, MinioService],
  exports: [FilesService],
})
export class FilesModule {}
