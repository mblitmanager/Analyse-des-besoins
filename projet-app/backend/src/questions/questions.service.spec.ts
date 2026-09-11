import { BadRequestException } from '@nestjs/common';
import { QuestionsService } from './questions.service';

describe('QuestionsService', () => {
  it('should be defined', () => {
    const repo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    const service = new QuestionsService(
      repo as any,
      {} as any,
      {} as any,
      { query: jest.fn() } as any,
    );

    expect(service).toBeDefined();
  });

  it('should duplicate valid questions and return the created count', async () => {
    const repo = {
      find: jest.fn().mockResolvedValue([
        {
          id: 1,
          text: 'Question 1',
          options: ['A', 'B'],
          correctResponseIndex: 0,
          correctResponseIndexes: [0],
          type: 'prerequis',
          responseType: 'qcm',
          category: 'test',
          icon: 'quiz',
          metadata: {},
          isActive: true,
          order: 1,
          showIfRules: null,
          formation: null,
          level: null,
        },
      ]),
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((data) => data),
      save: jest.fn().mockImplementation(async (data) => ({ ...data, id: 99 })),
    };

    const service = new QuestionsService(
      repo as any,
      {} as any,
      {} as any,
      { query: jest.fn().mockResolvedValue([]) } as any,
    );

    await expect(service.duplicate([1], null, null)).resolves.toEqual({
      success: true,
      count: 1,
    });
  });

  it('should surface duplicate errors instead of returning a silent success', async () => {
    const repo = {
      find: jest.fn().mockResolvedValue([
        {
          id: 1,
          text: 'Question 1',
          options: ['A', 'B'],
          correctResponseIndex: 0,
          correctResponseIndexes: [0],
          type: 'prerequis',
          responseType: 'qcm',
          category: 'test',
          icon: 'quiz',
          metadata: {},
          isActive: true,
          order: 1,
          showIfRules: null,
          formation: null,
          level: null,
        },
      ]),
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((data) => data),
      save: jest.fn().mockRejectedValue(new Error('DB validation failed')),
    };

    const service = new QuestionsService(
      repo as any,
      {} as any,
      {} as any,
      { query: jest.fn().mockResolvedValue([]) } as any,
    );

    await expect(service.duplicate([1], null, null)).rejects.toThrow(
      BadRequestException,
    );
  });
});
