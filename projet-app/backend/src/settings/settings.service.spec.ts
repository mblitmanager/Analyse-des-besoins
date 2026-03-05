import { Test, TestingModule } from '@nestjs/testing';
import { SettingsService } from './settings.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Setting } from '../entities/setting.entity';
import { Repository } from 'typeorm';

describe('SettingsService', () => {
  let service: SettingsService;
  let repo: Repository<Setting>;

  const mockSettingRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        {
          provide: getRepositoryToken(Setting),
          useValue: mockSettingRepo,
        },
      ],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
    repo = module.get<Repository<Setting>>(getRepositoryToken(Setting));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getValue', () => {
    it('should return the value of an existing setting', async () => {
      mockSettingRepo.findOne.mockResolvedValue({
        key: 'HIGH_LEVEL_ALERT_FORMATIONS',
        value: 'Word,PowerPoint',
        description: 'Test description',
      });

      const result = await service.getValue(
        'HIGH_LEVEL_ALERT_FORMATIONS',
        'DefaultValue',
      );
      expect(result).toBe('Word,PowerPoint');
      expect(mockSettingRepo.findOne).toHaveBeenCalledWith({
        where: { key: 'HIGH_LEVEL_ALERT_FORMATIONS' },
      });
    });

    it('should return the default value if the setting does not exist', async () => {
      mockSettingRepo.findOne.mockResolvedValue(null);

      const result = await service.getValue(
        'NON_EXISTENT_KEY',
        'default string',
      );
      expect(result).toBe('default string');
    });
  });

  describe('update', () => {
    it('should update an existing setting', async () => {
      const existingSetting = { key: 'TEST_KEY', value: 'old_value' };
      mockSettingRepo.findOne.mockResolvedValue(existingSetting);
      mockSettingRepo.save.mockResolvedValue({
        ...existingSetting,
        value: 'new_value',
      });

      const result = await service.update('TEST_KEY', 'new_value');

      expect(mockSettingRepo.findOne).toHaveBeenCalledWith({
        where: { key: 'TEST_KEY' },
      });
      expect(existingSetting.value).toBe('new_value');
      expect(mockSettingRepo.save).toHaveBeenCalledWith(existingSetting);
      expect(result.value).toBe('new_value');
    });

    it('should create and save a new setting if it does not exist', async () => {
      mockSettingRepo.findOne.mockResolvedValue(null);
      const newSetting = { key: 'NEW_KEY', value: 'new_value' };
      mockSettingRepo.create.mockReturnValue(newSetting);
      mockSettingRepo.save.mockResolvedValue(newSetting);

      const result = await service.update('NEW_KEY', 'new_value');

      expect(mockSettingRepo.create).toHaveBeenCalledWith({
        key: 'NEW_KEY',
        value: 'new_value',
      });
      expect(mockSettingRepo.save).toHaveBeenCalledWith(newSetting);
      expect(result).toEqual(newSetting);
    });
  });
});
