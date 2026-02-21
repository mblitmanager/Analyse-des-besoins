import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SeedService } from './seed.service';
import { Formation } from './entities/formation.entity';
import { Level } from './entities/level.entity';
import { Question } from './entities/question.entity';
import { Session } from './entities/session.entity';
import { Contact } from './entities/contact.entity';
import { Stagiaire } from './entities/stagiaire.entity';
import { WorkflowStep } from './entities/workflow-step.entity';
import { FormationsModule } from './formations/formations.module';
import { QuestionsModule } from './questions/questions.module';
import { SessionsModule } from './sessions/sessions.module';
import { ContactsModule } from './contacts/contacts.module';
import { WorkflowModule } from './workflow/workflow.module';
import { EmailService } from './email/email.service';
import { EmailModule } from './email/email.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('DATABASE_URL');

        if (databaseUrl) {
          return {
            type: 'postgres',
            url: databaseUrl,
            entities: [
              Formation,
              Level,
              Question,
              Session,
              Contact,
              Stagiaire,
              WorkflowStep,
            ],
            synchronize: false,
            ssl: true,
          };
        }

        return {
          type: 'postgres',
          host: configService.get<string>('DATABASE_HOST') || 'localhost',
          port: configService.get<number>('DATABASE_PORT') || 5432,
          username: configService.get<string>('DATABASE_USER') || 'user',
          password:
            configService.get<string>('DATABASE_PASSWORD') || 'password',
          database: configService.get<string>('DATABASE_NAME') || 'wizzylearn',
          entities: [
            Formation,
            Level,
            Question,
            Session,
            Contact,
            Stagiaire,
            WorkflowStep,
          ],
          synchronize: false,
        };
      },
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([
      Formation,
      Level,
      Question,
      Session,
      Contact,
      Stagiaire,
      WorkflowStep,
    ]),
    FormationsModule,
    QuestionsModule,
    SessionsModule,
    EmailModule,
    ContactsModule,
    WorkflowModule,
  ],
  controllers: [AppController],
  providers: [AppService, SeedService, EmailService],
})
export class AppModule {}
