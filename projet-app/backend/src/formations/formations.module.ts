import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FormationsService } from './formations.service';
import { FormationsController } from './formations.controller';
import { Formation } from '../entities/formation.entity';
import { Level } from '../entities/level.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Formation, Level])],
  providers: [FormationsService],
  controllers: [FormationsController],
})
export class FormationsModule {}
