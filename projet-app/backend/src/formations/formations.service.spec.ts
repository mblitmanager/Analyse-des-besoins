import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FormationsService } from './formations.service';
import { Formation } from '../entities/formation.entity';
import { Level } from '../entities/level.entity';
import { P3FilterRulesApplicationService } from '../p3-filter-rules/p3-filter-rules-application.service';

describe('FormationsService', () => {
  let service: FormationsService;
  let formationRepo: Repository<Formation>;
  let levelRepo: Repository<Level>;
  let p3FilterService: P3FilterRulesApplicationService;

  const mockFormation = {
    id: 1,
    label: 'Excel',
    slug: 'excel',
    category: 'Bureautique',
    certifier: 'Microsoft',
    isActive: true,
    availableInP3Only: false,
    levels: [],
  };

  const mockLevel = {
    id: 1,
    label: 'Initial',
    order: 1,
    threshold: 3,
    formation: mockFormation,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FormationsService,
        {
          provide: getRepositoryToken(Formation),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            merge: jest.fn(),
            remove: jest.fn(),
            manager: {
              createQueryBuilder: jest.fn(),
            },
          },
        },
        {
          provide: getRepositoryToken(Level),
          useValue: {
            find: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: P3FilterRulesApplicationService,
          useValue: {
            applyP3Rules: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<FormationsService>(FormationsService);
    formationRepo = module.get<Repository<Formation>>(getRepositoryToken(Formation));
    levelRepo = module.get<Repository<Level>>(getRepositoryToken(Level));
    p3FilterService = module.get<P3FilterRulesApplicationService>(P3FilterRulesApplicationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all formations when no filters applied', async () => {
      jest.spyOn(formationRepo, 'find').mockResolvedValue([mockFormation] as any);

      const result = await service.findAll();

      expect(formationRepo.find).toHaveBeenCalledWith({
        where: {},
        order: { label: 'ASC' },
        relations: ['levels'],
      });
      expect(result).toEqual([mockFormation]);
    });

    it('should return only active formations when activeOnly is true', async () => {
      jest.spyOn(formationRepo, 'find').mockResolvedValue([mockFormation] as any);

      await service.findAll(true);

      expect(formationRepo.find).toHaveBeenCalledWith({
        where: { isActive: true, availableInP3Only: false },
        order: { label: 'ASC' },
        relations: ['levels'],
      });
    });

    it('should return active formations including P3 only when includeP3Only is true', async () => {
      jest.spyOn(formationRepo, 'find').mockResolvedValue([mockFormation] as any);

      await service.findAll(true, true);

      expect(formationRepo.find).toHaveBeenCalledWith({
        where: { isActive: true },
        order: { label: 'ASC' },
        relations: ['levels'],
      });
    });
  });

  describe('findBySlug', () => {
    it('should return formation by slug with levels', async () => {
      jest.spyOn(formationRepo, 'findOne').mockResolvedValue(mockFormation as any);

      const result = await service.findBySlug('excel');

      expect(formationRepo.findOne).toHaveBeenCalledWith({
        where: { slug: 'excel' },
        relations: ['levels'],
      });
      expect(result).toEqual(mockFormation);
    });
  });

  describe('findBySlugOrLabel', () => {
    it('should return formation by slug', async () => {
      jest.spyOn(formationRepo, 'findOne').mockResolvedValue(mockFormation as any);

      const result = await service.findBySlugOrLabel('excel');

      expect(formationRepo.findOne).toHaveBeenCalledWith({
        where: [{ slug: 'excel' }, { label: 'excel' }],
        relations: ['levels'],
      });
      expect(result).toEqual(mockFormation);
    });

    it('should return null when value is empty', async () => {
      const result = await service.findBySlugOrLabel('');

      expect(result).toBeNull();
      expect(formationRepo.findOne).not.toHaveBeenCalled();
    });
  });

  describe('findLevelsBySlug', () => {
    it('should return levels ordered by order', async () => {
      jest.spyOn(levelRepo, 'find').mockResolvedValue([mockLevel] as any);

      const result = await service.findLevelsBySlug('excel');

      expect(levelRepo.find).toHaveBeenCalledWith({
        where: { formation: { slug: 'excel' } },
        order: { order: 'ASC' },
      });
      expect(result).toEqual([mockLevel]);
    });
  });

  describe('create', () => {
    it('should create and save formation', async () => {
      const newFormation = { label: 'Word', slug: 'word' };
      jest.spyOn(formationRepo, 'create').mockReturnValue(mockFormation as any);
      jest.spyOn(formationRepo, 'save').mockResolvedValue(mockFormation as any);

      const result = await service.create(newFormation);

      expect(formationRepo.create).toHaveBeenCalledWith(newFormation);
      expect(formationRepo.save).toHaveBeenCalled();
      expect(result).toEqual(mockFormation);
    });
  });

  describe('getAvailableFormationsForSession', () => {
    it('should apply P3 filter rules to formations', async () => {
      const mockSession = {
        id: 'session-1',
        formationChoisie: 'excel',
      } as any;

      const mockFormations = [mockFormation] as unknown as Formation[];
      const filteredFormations = [mockFormation] as unknown as Formation[];

      jest.spyOn(service, 'findAll').mockResolvedValue(mockFormations);
      jest.spyOn(p3FilterService, 'applyP3Rules').mockResolvedValue(filteredFormations);

      const result = await service.getAvailableFormationsForSession(mockSession, true);

      expect(service.findAll).toHaveBeenCalledWith(true, true);
      expect(p3FilterService.applyP3Rules).toHaveBeenCalledWith(mockFormations, mockSession);
      expect(result).toEqual(filteredFormations);
    });
  });
});
