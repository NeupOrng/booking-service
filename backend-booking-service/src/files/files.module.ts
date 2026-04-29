import { Global, Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { FilesRepository } from './files.repository';
import { SupabaseStorageService } from './supabase.service';

@Global()
@Module({
  controllers: [FilesController],
  providers: [FilesService, FilesRepository, SupabaseStorageService],
  exports: [FilesService],
})
export class FilesModule {}
