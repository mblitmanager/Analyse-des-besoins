import { NotFoundException } from '@nestjs/common';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { TestRunsService } from './test-runs.service';

describe('TestRunsService', () => {
  let dir: string;
  let service: TestRunsService;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'e2e-results-'));
    const writeRun = (id: string, startedAt: string) => {
      mkdirSync(join(dir, id, 'case1'), { recursive: true });
      writeFileSync(
        join(dir, id, 'run.json'),
        JSON.stringify({ id, startedAt, totals: { total: 1 }, cases: [{ id: 'case1' }] }),
      );
      writeFileSync(join(dir, id, 'case1', 'shot.png'), 'png');
    };
    writeRun('20260101T000000Z', '2026-01-01T00:00:00Z');
    writeRun('20260201T000000Z', '2026-02-01T00:00:00Z');
    mkdirSync(join(dir, 'incomplete'));
    service = new TestRunsService({ get: () => dir } as any);
  });

  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it('lists published runs, newest first, without their cases', () => {
    const runs = service.listRuns();
    expect(runs.map((r: any) => r.id)).toEqual(['20260201T000000Z', '20260101T000000Z']);
    expect(runs[0]).not.toHaveProperty('cases');
  });

  it('returns a run with its cases', () => {
    expect(service.getRun('20260101T000000Z').cases).toHaveLength(1);
  });

  it('resolves screenshots inside the run folder only', () => {
    expect(service.screenshotPath('20260101T000000Z', 'case1', 'shot.png')).toBe(
      join(dir, '20260101T000000Z', 'case1', 'shot.png'),
    );
    for (const args of [
      ['..', 'case1', 'shot.png'],
      ['20260101T000000Z', '..', 'run.json'],
      ['20260101T000000Z', 'case1', '../../run.json'],
      ['20260101T000000Z', 'case1', 'run.json'],
    ]) {
      const [runId, caseId, file] = args;
      expect(() => service.screenshotPath(runId, caseId, file)).toThrow(NotFoundException);
    }
    expect(() => service.getRun('../etc')).toThrow(NotFoundException);
  });

  it('returns no runs when the results folder does not exist', () => {
    const missing = new TestRunsService({ get: () => join(dir, 'missing') } as any);
    expect(missing.listRuns()).toEqual([]);
  });
});
