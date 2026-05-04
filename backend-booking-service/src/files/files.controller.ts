import {
    Controller,
    Post,
    Get,
    Delete,
    Param,
    Query,
    UploadedFile,
    UseGuards,
    UseInterceptors,
    Logger,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiBody,
    ApiConsumes,
    ApiOperation,
    ApiParam,
    ApiQuery,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { FilesService } from './files.service';
import { FileResponseDto } from './dto/file-response.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('files')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('files')
export class FilesController {
    constructor(private readonly filesService: FilesService) {}

    @ApiOperation({ summary: 'Upload a file to object storage' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            required: ['file'],
            properties: {
                file: { type: 'string', format: 'binary' },
            },
        },
    })
    @ApiQuery({ name: 'subfolder', required: false, example: 'bookings' })
    @ApiResponse({ status: 201, type: FileResponseDto })
    @Post('upload')
    @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
    async upload(
        @UploadedFile() file: Express.Multer.File,
        @CurrentUser() user: { id: string },
        @Query('subfolder') subfolder?: string,
    ): Promise<FileResponseDto> {
        const record = await this.filesService.uploadFile(
            file,
            user.id,
            subfolder,
        );
        return new FileResponseDto(record);
    }

    @ApiOperation({
        summary: 'Get a presigned download URL for a file (1-hour expiry)',
    })
    @ApiParam({ name: 'id', description: 'File UUID' })
    @ApiResponse({ status: 200, schema: { example: { url: 'https://...' } } })
    @ApiResponse({ status: 404, description: 'File not found' })
    @Get(':id/url')
    async getUrl(@Param('id') id: string): Promise<{ url: string }> {
        const url = await this.filesService.getFileUrl(id);
        return { url };
    }

    @ApiOperation({ summary: 'Delete a file from storage and database' })
    @ApiParam({ name: 'id', description: 'File UUID' })
    @ApiResponse({
        status: 200,
        schema: { example: { message: 'File deleted' } },
    })
    @ApiResponse({ status: 404, description: 'File not found' })
    @Delete(':id')
    async remove(@Param('id') id: string): Promise<{ message: string }> {
        await this.filesService.deleteFile(id);
        return { message: 'File deleted' };
    }
}
