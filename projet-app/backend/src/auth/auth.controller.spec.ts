import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  const authService = {
    validateUser: jest.fn().mockResolvedValue(null),
    login: jest.fn(),
  };
  const controller = new AuthController(authService as unknown as AuthService);

  beforeEach(() => {
    jest.clearAllMocks();
    authService.validateUser.mockResolvedValue(null);
  });

  it.each([undefined, {}, { email: 'admin@example.com' }])(
    'rejects incomplete login bodies with 401',
    async (body) => {
      await expect(controller.login(body)).rejects.toBeInstanceOf(UnauthorizedException);
    },
  );
});