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
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SessionsService } from './sessions.service';
import { FormationsService } from '../formations/formations.service';
import { PdfService } from '../pdf/pdf.service';
import { Res, Query } from '@nestjs/common';

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
  stopLevelOrder?: number;
  finalRecommendation?: string;
  parcoursTitle?: string | null;
  parcoursChoices?: Array<{
    id?: number | string;
    title: string;
    recommendations: string[];
    explanationMessage?: string | null;
  }> | null;
  parcoursRuleHadPrereqCondition?: boolean;
  explanationMessage?: string;
  complementaryQuestions?: any;
  availabilities?: any;
  ignoreQuestionRules?: boolean;
  formationChoisie?: string;
  isP3Mode?: boolean;
  p3SkipQuiz?: boolean;
  skipFormationReset?: boolean;
  isCompleted?: boolean;
  scorePretest?: number;
  emailSentAt?: Date;
}

@ApiTags('sessions')
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
  async downloadPdf(@Param('id') id: string, @Query('part') part: string, @Res() res: any) {
    const session = await this.sessionsService.findOne(id);
    if (!session) {
      return res.status(404).send('Session not found');
    }

    const processed = await this.sessionsService.getRecommendationData(session);
    let parcoursNumber = await this.sessionsService.getParcoursNumber(session);

    let recommendationsList = processed.recommendations || [];
    if (recommendationsList.length === 0) {
      recommendationsList = [session.formationChoisie || 'Analyse'];
    }

    const fullRecommendation = recommendationsList.join(' & ');
    let rec = recommendationsList.join(' & ');
    if (part !== undefined) {
      const partIndex = parseInt(part, 10);
      if (!isNaN(partIndex) && partIndex >= 0 && partIndex < recommendationsList.length) {
        rec = recommendationsList[partIndex];
        if (recommendationsList.length > 1) {
          parcoursNumber += partIndex;
        }
      }
    }

    const pdfBuffer = await this.pdfService.generateSessionPdf({
      civilite: session.civilite,
      prenom: session.prenom,
      nom: session.nom,
      telephone: session.telephone,
      conseiller: session.conseiller,
      metier: session.metier,
      situation: session.situation,
      formationChoisie: session.formationChoisie,
      finalRecommendation: rec,
      parcoursTitle: processed.parcoursTitle || session.parcoursTitle,
      recommendations: recommendationsList,
      fullRecommendation,
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
      correctAnswersById: processed.correctAnswersById,
      positionnementAnswers: session.positionnementAnswers,
    });

    const filename = this.sessionsService.generatePdfFilename(session, session.formationChoisie || 'Analyse', undefined, parcoursNumber);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
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
  findAll(@Query('stagiaireId') stagiaireId?: string) {
    return this.sessionsService.findAll(stagiaireId);
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

  @Post(':id/resend')
  @UseGuards(JwtAuthGuard)
  resendEmail(@Param('id') id: string) {
    return this.sessionsService.resendEmail(id);
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
