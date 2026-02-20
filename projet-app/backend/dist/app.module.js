"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const seed_service_1 = require("./seed.service");
const formation_entity_1 = require("./entities/formation.entity");
const level_entity_1 = require("./entities/level.entity");
const question_entity_1 = require("./entities/question.entity");
const session_entity_1 = require("./entities/session.entity");
const formations_module_1 = require("./formations/formations.module");
const questions_module_1 = require("./questions/questions.module");
const sessions_module_1 = require("./sessions/sessions.module");
const email_service_1 = require("./email/email.service");
const email_module_1 = require("./email/email.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => ({
                    type: configService.get('DATABASE_TYPE') || 'postgres',
                    host: configService.get('DATABASE_HOST') || 'localhost',
                    port: configService.get('DATABASE_PORT') || 5432,
                    username: configService.get('DATABASE_USER') || 'user',
                    password: configService.get('DATABASE_PASSWORD') || 'password',
                    database: configService.get('DATABASE_NAME') || 'wizzylearn',
                    entities: [formation_entity_1.Formation, level_entity_1.Level, question_entity_1.Question, session_entity_1.Session],
                    synchronize: true,
                }),
                inject: [config_1.ConfigService],
            }),
            typeorm_1.TypeOrmModule.forFeature([formation_entity_1.Formation, level_entity_1.Level, question_entity_1.Question, session_entity_1.Session]),
            formations_module_1.FormationsModule,
            questions_module_1.QuestionsModule,
            sessions_module_1.SessionsModule,
            email_module_1.EmailModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService, seed_service_1.SeedService, email_service_1.EmailService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map