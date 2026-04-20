import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FormationsService } from './formations.service';
import { FormationsController } from './formations.controller';
import { Formation } from '../entities/formation.entity';
import { Level } from '../entities/level.entity';
import { P3FilterRulesModule } from '../p3-filter-rules/p3-filter-rules.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Formation, Level]),
    P3FilterRulesModule,
  ],
  providers: [FormationsService],
  controllers: [FormationsController],
  exports: [FormationsService],
})
export class FormationsModule {}
