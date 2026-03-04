import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParcoursRule } from '../entities/parcours-rule.entity';
import { ParcoursService } from './parcours.service';
import { ParcoursController } from './parcours.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ParcoursRule])],
  providers: [ParcoursService],
  controllers: [ParcoursController],
  exports: [ParcoursService],
})
export class ParcoursModule {}
