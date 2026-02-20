import { OnApplicationBootstrap } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Formation } from './entities/formation.entity';
import { Level } from './entities/level.entity';
import { Question } from './entities/question.entity';
export declare class SeedService implements OnApplicationBootstrap {
    private formationRepo;
    private levelRepo;
    private questionRepo;
    constructor(formationRepo: Repository<Formation>, levelRepo: Repository<Level>, questionRepo: Repository<Question>);
    onApplicationBootstrap(): Promise<void>;
}
