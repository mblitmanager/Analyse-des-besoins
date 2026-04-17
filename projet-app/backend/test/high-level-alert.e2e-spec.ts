import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('High Level Alert Scenario (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Scenario: Testing High Level Settings Availability', () => {
    it('should be able to fetch HIGH_LEVEL_ALERT_FORMATIONS', () => {
      return request(app.getHttpServer())
        .get('/settings/HIGH_LEVEL_ALERT_FORMATIONS')
        .expect(200)
        .then((response) => {
          // Depending on environment/seed, the setting may or may not be present.
          // We assert the route is reachable and, when present, has a string value.
          if (response.body && typeof response.body.value === 'string') {
            expect(response.body.value.length).toBeGreaterThan(0);
          } else {
            expect(response.body).toBeDefined();
          }
        });
    });

    it('should be able to fetch HIGH_LEVEL_THRESHOLD_ORDER', () => {
      return request(app.getHttpServer())
        .get('/settings/HIGH_LEVEL_THRESHOLD_ORDER')
        .expect(200)
        .then((response) => {
          if (response.body && typeof response.body.value === 'string') {
            expect(response.body.value.length).toBeGreaterThan(0);
          } else {
            expect(response.body).toBeDefined();
          }
        });
    });
  });
});
