import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { P3FilterRule } from '../entities/p3-filter-rule.entity';
import { P3FilterRulesService } from './p3-filter-rules.service';
import { P3FilterRulesController } from './p3-filter-rules.controller';
import { P3FilterRulesApplicationService } from './p3-filter-rules-application.service';

@Module({
  imports: [TypeOrmModule.forFeature([P3FilterRule])],
  providers: [P3FilterRulesService, P3FilterRulesApplicationService],
  controllers: [P3FilterRulesController],
  exports: [P3FilterRulesService, P3FilterRulesApplicationService],
})
export class P3FilterRulesModule {}
