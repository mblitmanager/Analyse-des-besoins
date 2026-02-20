import { Repository } from 'typeorm';
import { Session } from '../entities/session.entity';
import { Level } from '../entities/level.entity';
import { EmailService } from '../email/email.service';
export declare class SessionsService {
    private sessionRepo;
    private levelRepo;
    private emailService;
    constructor(sessionRepo: Repository<Session>, levelRepo: Repository<Level>, emailService: EmailService);
    create(data: Partial<Session>): Promise<Session>;
    findOne(id: string): Promise<Session>;
    update(id: string, data: Partial<Session>): Promise<Session>;
    submit(id: string): Promise<Session>;
}
