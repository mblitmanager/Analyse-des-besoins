import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { Session } from '../entities/session.entity';
import { Question } from '../entities/question.entity';
import { Formation } from '../entities/formation.entity';
import { User } from '../entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Session, Question, Formation, User])],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}
