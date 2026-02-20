import { FormationsService } from './formations.service';
export declare class FormationsController {
    private readonly formationsService;
    constructor(formationsService: FormationsService);
    findAll(): Promise<import("../entities/formation.entity").Formation[]>;
}
