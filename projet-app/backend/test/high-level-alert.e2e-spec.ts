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
          expect(response.body).toHaveProperty('value');
          // Since the database was seeded previously, we can expect the string to contain formations
          expect(response.body.value).toContain('Word');
          expect(response.body.value).toContain('DigComp');
        });
    });

    it('should be able to fetch HIGH_LEVEL_THRESHOLD_ORDER', () => {
      return request(app.getHttpServer())
        .get('/settings/HIGH_LEVEL_THRESHOLD_ORDER')
        .expect(200)
        .then((response) => {
          expect(response.body).toHaveProperty('value');
          // Normally it should be '2' as seeded
          expect(response.body.value).toBe('2');
        });
    });
  });
});
