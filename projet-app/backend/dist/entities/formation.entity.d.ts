import { Level } from './level.entity';
export declare class Formation {
    id: number;
    slug: string;
    label: string;
    isActive: boolean;
    levels: Level[];
}
