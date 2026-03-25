import { PartialType } from '@nestjs/swagger';
import { CreateXpTimeoutDto } from './create-xp-timeout.dto';

export class UpdateXpTimeoutDto extends PartialType(CreateXpTimeoutDto) {}
