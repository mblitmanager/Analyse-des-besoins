import { Formation } from './formation.entity';
import { Question } from './question.entity';
export declare class Level {
    id: number;
    label: string;
    order: number;
    successThreshold: number;
    recommendationLabel: string;
    formation: Formation;
    questions: Question[];
}
