import { OnApplicationBootstrap } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Formation } from './entities/formation.entity';
import { Level } from './entities/level.entity';
import { Question } from './entities/question.entity';
import { Setting } from './entities/setting.entity';
import { User } from './entities/user.entity';
export declare class SeedService implements OnApplicationBootstrap {
    private formationRepo;
    private levelRepo;
    private questionRepo;
    private userRepo;
    private settingRepo;
    constructor(formationRepo: Repository<Formation>, levelRepo: Repository<Level>, questionRepo: Repository<Question>, userRepo: Repository<User>, settingRepo: Repository<Setting>);
    onApplicationBootstrap(): Promise<void>;
    seedSettings(): Promise<void>;
    seedAdmin(): Promise<void>;
    seedFormations(): Promise<void>;
    seedWorkflow(): Promise<void>;
}
