import { SessionsService } from './sessions.service';
export declare class CreateSessionDto {
    brand: string;
    civilite: string;
    nom: string;
    prenom: string;
    telephone: string;
    conseiller: string;
    formationChoisie: string;
}
export declare class UpdateSessionDto {
    prerequisiteScore?: any;
    levelsScores?: any;
}
export declare class SessionsController {
    private readonly sessionsService;
    constructor(sessionsService: SessionsService);
    create(data: CreateSessionDto): Promise<import("../entities/session.entity").Session>;
    update(id: string, data: UpdateSessionDto): Promise<import("../entities/session.entity").Session>;
    submit(id: string): Promise<import("../entities/session.entity").Session>;
}
