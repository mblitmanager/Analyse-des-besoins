import { Repository } from 'typeorm';
import { Question } from '../entities/question.entity';
export declare class QuestionsService {
    private questionRepo;
    constructor(questionRepo: Repository<Question>);
    findPrerequisites(): Promise<Question[]>;
    findByLevel(formationSlug: string, levelLabel: string): Promise<Question[]>;
}
