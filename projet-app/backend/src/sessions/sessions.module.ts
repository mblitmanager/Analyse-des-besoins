import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionsService } from './sessions.service';
import { SessionsController } from './sessions.controller';
import { Session } from '../entities/session.entity';
import { Level } from '../entities/level.entity';
import { Stagiaire } from '../entities/stagiaire.entity';
import { Question } from '../entities/question.entity';
import { EmailModule } from '../email/email.module';
import { SettingsModule } from '../settings/settings.module';
import { PdfModule } from '../pdf/pdf.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Session, Level, Stagiaire, Question]),
    EmailModule,
    SettingsModule,
    PdfModule,
  ],
  providers: [SessionsService],
  controllers: [SessionsController],
})
export class SessionsModule {}
