import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from '../entities/session.entity';
import { Question } from '../entities/question.entity';
import { Formation } from '../entities/formation.entity';
import { User } from '../entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Session)
    private sessionRepo: Repository<Session>,
    @InjectRepository(Question)
    private questionRepo: Repository<Question>,
    @InjectRepository(Formation)
    private formationRepo: Repository<Formation>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async getUsers() {
    return this.userRepo.find({
      select: ['id', 'email', 'role', 'createdAt'],
      order: { createdAt: 'DESC' },
    });
  }

  async createAdmin(email: string, pass: string) {
    const hashedPassword = await bcrypt.hash(pass, 10);
    const user = this.userRepo.create({
      email,
      password: hashedPassword,
      role: 'admin',
    });
    return this.userRepo.save(user);
  }

  async deleteUser(id: number) {
    return this.userRepo.delete(id);
  }

  async getStats() {
    const totalSessions = await this.sessionRepo.count();
    const totalQuestions = await this.questionRepo.count();
    const totalFormations = await this.formationRepo.count();

    // Simple average score calculation
    const sessions = await this.sessionRepo.find({
      select: { scorePretest: true },
    });
    const avgScore =
      sessions.length > 0
        ? Math.round(
            sessions.reduce((acc, s) => acc + (s.scorePretest || 0), 0) /
              sessions.length,
          )
        : 0;

    return {
      totalSessions,
      totalQuestions,
      totalFormations,
      avgScore: `${avgScore}%`,
    };
  }
}
