import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { join, resolve } from 'path';

/** Identifiers written by scripts/e2e-publish.mjs; anything else is rejected. */
const SAFE_SEGMENT = /^[\w.-]+$/;

/**
 * Read-only access to the E2E campaigns published by scripts/run-e2e-screenshots.sh
 * (one folder per run: run.json + screenshots per case).
 */
@Injectable()
export class TestRunsService {
  constructor(private readonly configService: ConfigService) {}

  private get baseDir(): string {
    return resolve(
      this.configService.get<string>('E2E_RESULTS_DIR') || join(process.cwd(), 'e2e-results'),
    );
  }

  private runFile(runId: string): string {
    if (!SAFE_SEGMENT.test(runId)) throw new NotFoundException();
    const file = join(this.baseDir, runId, 'run.json');
    if (!existsSync(file)) throw new NotFoundException('Campagne introuvable');
    return file;
  }

  listRuns() {
    if (!existsSync(this.baseDir)) return [];
    return readdirSync(this.baseDir)
      .filter((id) => SAFE_SEGMENT.test(id) && existsSync(join(this.baseDir, id, 'run.json')))
      .map((id) => {
        const { cases, ...summary } = JSON.parse(readFileSync(this.runFile(id), 'utf8'));
        return summary;
      })
      .sort((a, b) => String(b.startedAt).localeCompare(String(a.startedAt)));
  }

  getRun(runId: string) {
    return JSON.parse(readFileSync(this.runFile(runId), 'utf8'));
  }

  screenshotPath(runId: string, caseId: string, file: string): string {
    if (![runId, caseId, file].every((s) => SAFE_SEGMENT.test(s)) || !file.endsWith('.png')) {
      throw new NotFoundException();
    }
    const path = join(this.baseDir, runId, caseId, file);
    if (!existsSync(path) || !statSync(path).isFile()) throw new NotFoundException();
    return path;
  }
}
