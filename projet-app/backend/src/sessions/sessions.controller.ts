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
}

@Controller('sessions')
export class SessionsController {
  constructor(
    private readonly sessionsService: SessionsService,
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

    const pdfBuffer = await this.pdfService.generateSessionPdf(session as any);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Analyse_des_besoins_${session.prenom}_${session.nom}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
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
