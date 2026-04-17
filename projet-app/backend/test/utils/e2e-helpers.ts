import { Test, TestingModule } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

export async function createE2EApp(options?: {
  globalPrefix?: string;
}): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  if (options?.globalPrefix) {
    app.setGlobalPrefix(options.globalPrefix);
  }
  await app.init();
  return app;
}

export function uniqueEmail(prefix = 'e2e-admin') {
  const rand = Math.random().toString(16).slice(2);
  return `${prefix}-${Date.now()}-${rand}@example.com`;
}

export async function signupAndLoginAdmin(params: {
  app: INestApplication;
  apiPrefix?: string;
  email?: string;
  password?: string;
}) {
  const apiPrefix = params.apiPrefix ?? '';
  const email = params.email ?? uniqueEmail();
  const password = params.password ?? 'Test12345!';

  // signup is open and creates an admin user
  await request(params.app.getHttpServer())
    .post(`${apiPrefix}/auth/signup`)
    .send({ email, password, name: 'E2E Admin' })
    .expect(201);

  const loginRes = await request(params.app.getHttpServer())
    .post(`${apiPrefix}/auth/login`)
    .send({ email, password })
    .expect(201);

  const token = loginRes.body?.access_token;
  if (!token) {
    throw new Error('E2E login did not return access_token');
  }

  return { email, password, token };
}

export function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

