/// <reference types="multer" />
import { FilesService } from './files.service';
import { FileResponseDto } from './dto/file-response.dto';
export declare class FilesController {
    private readonly filesService;
    constructor(filesService: FilesService);
    upload(file: Express.Multer.File, user: {
        id: string;
    }, subfolder?: string): Promise<FileResponseDto>;
    getUrl(id: string): Promise<{
        url: string;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
