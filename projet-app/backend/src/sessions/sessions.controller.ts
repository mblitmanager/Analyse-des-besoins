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
import { FormationsService } from '../formations/formations.service';
import { PdfService } from '../pdf/pdf.service';
import type { Response } from 'express';
import { Res } from '@nestjs/common';

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
  ignoreQuestionRules?: boolean;
  formationChoisie?: string;
  isP3Mode?: boolean;
  p3SkipQuiz?: boolean;
  isCompleted?: boolean;
  scorePretest?: number;
  emailSentAt?: Date;
}

@Controller('sessions')
export class SessionsController {
  constructor(
    private readonly sessionsService: SessionsService,
    private readonly formationsService: FormationsService,
    private readonly pdfService: PdfService,
  ) {}

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sessionsService.findOne(id);
  }

  @Get(':id/pdf')
  async downloadPdf(@Param('id') id: string, @Res() res: Response) {
    const session = await this.sessionsService.findOne(id);
    if (!session) {
      return res.status(404).send('Session not found');
    }

    const processed = await this.sessionsService.getRecommendationData(session);
    const parcoursNumber = await this.sessionsService.getParcoursNumber(session);

    const pdfBuffer = await this.pdfService.generateSessionPdf({
      civilite: session.civilite,
      prenom: session.prenom,
      nom: session.nom,
      telephone: session.telephone,
      conseiller: session.conseiller,
      metier: session.metier,
      situation: session.situation,
      formationChoisie: session.formationChoisie,
      finalRecommendation: processed.recommendation,
      scoreFinal: processed.scorePretest,
      levelsScores: session.levelsScores as any,
      prerequisiteAnswers: processed.filteredPrerequis,
      complementaryAnswers: processed.filteredComplementaryAnswers,
      availabilityAnswers: processed.filteredAvailabilities,
      miseANiveauAnswers: processed.filteredMiseAnswers,
      qTextById: processed.qTextById,
      highLevelContinue: session.highLevelContinue,
      isP3Mode: session.isP3Mode,
      parcoursNumber,
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Analyse_des_besoins_${session.prenom}_${session.nom}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }

  @Get(':id/processed')
  @UseGuards(JwtAuthGuard)
  async getProcessed(@Param('id') id: string) {
    const session = await this.sessionsService.findOne(id);
    if (!session) return { error: 'Not found' };
    return this.sessionsService.getRecommendationData(session);
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

  /**
   * Get available formations for a session with P3 filter rules applied
   * 
   * Returns formations that are available to the user based on their
   * previous training path and applicable P3 filter rules
   * 
   * @param id - Session ID
   * @returns Filtered list of formations based on P3 rules
   */
  @Get(':id/available-formations-with-p3')
  async getAvailableFormationsWithP3(@Param('id') id: string) {
    const session = await this.sessionsService.findOne(id);
    return this.formationsService.getAvailableFormationsForSession(
      session,
      true, // activeOnly
    );
  }
}
