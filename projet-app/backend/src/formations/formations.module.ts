import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FormationsService } from './formations.service';
import { FormationsController } from './formations.controller';
import { Formation } from '../entities/formation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Formation])],
  providers: [FormationsService],
  controllers: [FormationsController],
})
export class FormationsModule {}
