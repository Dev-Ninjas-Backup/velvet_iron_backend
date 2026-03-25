import { Global, Module } from '@nestjs/common';
import { LeveladdService } from './leveladd.service';

@Global()
@Module({
  providers: [LeveladdService],
  exports: [LeveladdService],
})
export class LeveladdModule {}
