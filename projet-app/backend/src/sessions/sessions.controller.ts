import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  Get,
  UseGuards,
  Delete,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SessionsService } from './sessions.service';

export class CreateSessionDto {
  brand: string;
  civilite: string;
  nom: string;
  prenom: string;
  telephone: string;
  // conseiller is now optional; backend will accept null/undefined
  conseiller?: string | null;
  formationChoisie: string;
}

export class UpdateSessionDto {
  prerequisiteScore?: any;
  levelsScores?: any;
  positionnementAnswers?: any;
  lastValidatedLevel?: string;
  stopLevel?: string;
  finalRecommendation?: string;
  complementaryQuestions?: any;
  availabilities?: any;
}

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sessionsService.findOne(id);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.sessionsService.findAll();
  }

  @Post()
  create(@Body() data: CreateSessionDto) {
    return this.sessionsService.create(data);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: UpdateSessionDto) {
    return this.sessionsService.update(id, data);
  }

  @Post(':id/submit')
  submit(@Param('id') id: string) {
    return this.sessionsService.submit(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.sessionsService.remove(id);
  }
}
