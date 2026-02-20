import { Repository } from 'typeorm';
import { Formation } from '../entities/formation.entity';
export declare class FormationsService {
    private formationRepo;
    constructor(formationRepo: Repository<Formation>);
    findAll(): Promise<Formation[]>;
}
