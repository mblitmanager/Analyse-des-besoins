import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { TestRunsController } from './test-runs.controller';
import { TestRunsService } from './test-runs.service';
import { ParcoursMapController } from './parcours-map.controller';
import { ParcoursMapService } from './parcours-map.service';
import { ParcoursRule } from '../entities/parcours-rule.entity';
import { P3OverrideRule } from '../entities/p3-override-rule.entity';
import { Session } from '../entities/session.entity';
import { Question } from '../entities/question.entity';
import { Formation } from '../entities/formation.entity';
import { User } from '../entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Session, Question, Formation, User, ParcoursRule, P3OverrideRule])],
  providers: [AdminService, TestRunsService, ParcoursMapService],
  controllers: [AdminController, TestRunsController, ParcoursMapController],
})
export class AdminModule {}
