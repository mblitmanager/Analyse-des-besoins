import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { P3FilterRule } from '../entities/p3-filter-rule.entity';
import { P3FilterRulesService } from './p3-filter-rules.service';
import { P3FilterRulesController } from './p3-filter-rules.controller';

@Module({
  imports: [TypeOrmModule.forFeature([P3FilterRule])],
  providers: [P3FilterRulesService],
  controllers: [P3FilterRulesController],
  exports: [P3FilterRulesService],
})
export class P3FilterRulesModule {}
