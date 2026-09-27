import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';

/** Identifiers written by scripts/e2e-publish.mjs; anything else is rejected. */
const SAFE_SEGMENT = /^[\w.-]+$/;
const FORMATION_SLUG = /^[\w-]{1,60}$/;

export type TestRunRequest = { formations?: string[]; p3?: boolean };

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

  /** Campaign requests picked up on the host by scripts/e2e-runner.sh (cron). */
  private get requestsDir(): string {
    return resolve(
      this.configService.get<string>('E2E_REQUESTS_DIR') || join(process.cwd(), 'e2e-requests'),
    );
  }

  private pendingRequests(): any[] {
    if (!existsSync(this.requestsDir)) return [];
    return readdirSync(this.requestsDir)
      .filter((file) => /^[\w.-]+\.json$/.test(file))
      .sort()
      .map((file) => {
        try {
          return JSON.parse(readFileSync(join(this.requestsDir, file), 'utf8'));
        } catch {
          return { id: file.replace(/\.json$/, '') };
        }
      });
  }

  /** Runner state (runner-status.json, written by the host) and queued requests. */
  getStatus() {
    const statusFile = join(this.baseDir, 'runner-status.json');
    let runner: any = { state: 'idle' };
    if (existsSync(statusFile)) {
      try {
        runner = JSON.parse(readFileSync(statusFile, 'utf8'));
      } catch {
        runner = { state: 'unknown' };
      }
    }
    return { runner, pending: this.pendingRequests() };
  }

  /**
   * Queues a campaign. Only a JSON file with validated values is written: the
   * backend never runs a command, the host runner does.
   */
  requestRun(request: TestRunRequest, requestedBy: string) {
    const formations = Array.isArray(request?.formations) ? request.formations : [];
    if (formations.some((slug) => typeof slug !== 'string' || !FORMATION_SLUG.test(slug))) {
      throw new BadRequestException('Formation invalide');
    }
    const { runner, pending } = this.getStatus();
    if (pending.length || ['running', 'waiting'].includes(runner.state)) {
      throw new ConflictException('Une campagne est déjà en attente ou en cours');
    }
    const id = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
    const payload = {
      id,
      requestedAt: new Date().toISOString(),
      requestedBy: String(requestedBy || '').slice(0, 120),
      formations,
      p3: request?.p3 !== false,
    };
    mkdirSync(this.requestsDir, { recursive: true });
    writeFileSync(join(this.requestsDir, `${id}.json`), JSON.stringify(payload, null, 2));
    return payload;
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
