import { QuestionsService } from './questions.service';
export declare class QuestionsController {
    private readonly questionsService;
    constructor(questionsService: QuestionsService);
    findPrerequisites(): Promise<import("../entities/question.entity").Question[]>;
    findByLevel(formation: string, niveau: string): Promise<import("../entities/question.entity").Question[]>;
}
