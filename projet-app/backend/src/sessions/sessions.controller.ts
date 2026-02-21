import { Controller, Post, Body, Patch, Param, Get } from '@nestjs/common';
import { SessionsService } from './sessions.service';

export class CreateSessionDto {
  brand: string;
  civilite: string;
  nom: string;
  prenom: string;
  telephone: string;
  conseiller: string;
  formationChoisie: string;
}

export class UpdateSessionDto {
  prerequisiteScore?: any;
  levelsScores?: any;
}

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sessionsService.findOne(id);
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
}
