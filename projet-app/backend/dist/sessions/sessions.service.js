"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const session_entity_1 = require("../entities/session.entity");
const level_entity_1 = require("../entities/level.entity");
const email_service_1 = require("../email/email.service");
let SessionsService = class SessionsService {
    sessionRepo;
    levelRepo;
    emailService;
    constructor(sessionRepo, levelRepo, emailService) {
        this.sessionRepo = sessionRepo;
        this.levelRepo = levelRepo;
        this.emailService = emailService;
    }
    create(data) {
        const session = this.sessionRepo.create(data);
        return this.sessionRepo.save(session);
    }
    async findOne(id) {
        const session = await this.sessionRepo.findOne({ where: { id } });
        if (!session)
            throw new common_1.NotFoundException('Session not found');
        return session;
    }
    async update(id, data) {
        await this.sessionRepo.update(id, data);
        return this.findOne(id);
    }
    async submit(id) {
        const session = await this.findOne(id);
        const levels = await this.levelRepo.find({
            where: { formation: { label: session.formationChoisie } },
            order: { order: 'ASC' },
        });
        if (levels.length === 0) {
            return this.update(id, { finalRecommendation: 'Formation non reconnue' });
        }
        const scores = session.levelsScores || {};
        let finalLevel = levels[0];
        for (const level of levels) {
            const userScore = scores[level.label];
            if (userScore !== undefined) {
                if (userScore >= level.successThreshold) {
                    finalLevel = level;
                }
                else {
                    finalLevel = level;
                    break;
                }
            }
            else {
                break;
            }
        }
        const recommendation = finalLevel.recommendationLabel || `Niveau: ${finalLevel.label}`;
        return this.update(id, {
            finalRecommendation: recommendation,
            stopLevel: finalLevel.label,
            emailSentAt: new Date(),
        });
    }
};
exports.SessionsService = SessionsService;
exports.SessionsService = SessionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(session_entity_1.Session)),
    __param(1, (0, typeorm_1.InjectRepository)(level_entity_1.Level)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        email_service_1.EmailService])
], SessionsService);
//# sourceMappingURL=sessions.service.js.map