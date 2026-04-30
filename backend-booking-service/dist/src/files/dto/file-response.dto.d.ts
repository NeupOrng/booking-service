export declare class FileResponseDto {
    id: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    createdAt: Date;
    constructor(partial: Partial<FileResponseDto>);
}
