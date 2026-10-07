import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ParcoursMapService } from './parcours-map.service';

/** Parcours map (P1 + P2 and P3 possibilities per formation) for the admin dashboard. */
@Controller('admin/parcours-map')
@UseGuards(JwtAuthGuard)
export class ParcoursMapController {
  constructor(private readonly parcoursMapService: ParcoursMapService) {}

  @Get()
  get() {
    return this.parcoursMapService.build();
  }

  @Get('export.xlsx')
  async excel(@Res() res: Response) {
    const file = await this.parcoursMapService.toExcel();
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="cartographie-parcours.xlsx"',
    });
    res.send(file);
  }

  @Get('export.pdf')
  async pdf(@Res() res: Response) {
    const file = await this.parcoursMapService.toPdf();
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="cartographie-parcours.pdf"',
    });
    res.send(file);
  }
}
