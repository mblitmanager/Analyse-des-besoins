import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const userRepo = {
    findOne: jest.fn(),
  };
  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(
      userRepo as unknown as Repository<User>,
      {} as JwtService,
    );
  });

  it.each([
    [undefined, undefined],
    ['admin@example.com', undefined],
    [undefined, 'password'],
    ['', 'password'],
    ['admin@example.com', ''],
  ])('rejects missing credentials before querying for a user', async (email, password) => {
    await expect(
      service.validateUser(email as string, password as string),
    ).resolves.toBeNull();
    expect(userRepo.findOne).not.toHaveBeenCalled();
  });
});