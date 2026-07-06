import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { P3OverrideRule } from '../entities/p3-override-rule.entity';
import { P3OverrideService } from './p3-override.service';
import { P3OverrideController } from './p3-override.controller';

@Module({
  imports: [TypeOrmModule.forFeature([P3OverrideRule])],
  controllers: [P3OverrideController],
  providers: [P3OverrideService],
  exports: [P3OverrideService],
})
export class P3OverrideModule {}
