import { Level } from './level.entity';
export declare class Question {
    id: number;
    text: string;
    options: string[];
    correctResponseIndex: number;
    order: number;
    isActive: boolean;
    type: 'prerequis' | 'positionnement';
    level: Level;
}
