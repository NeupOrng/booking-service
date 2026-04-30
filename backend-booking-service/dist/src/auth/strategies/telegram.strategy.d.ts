import { ConfigService } from '@nestjs/config';
import { TelegramAuthDto } from '../dto/telegram-auth.dto';
export declare class TelegramStrategy {
    private configService;
    constructor(configService: ConfigService);
    verify(dto: TelegramAuthDto): boolean;
}
