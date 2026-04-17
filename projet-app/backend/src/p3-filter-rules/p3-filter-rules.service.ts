import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { P3FilterRule } from '../entities/p3-filter-rule.entity';

@Injectable()
export class P3FilterRulesService {
  constructor(
    @InjectRepository(P3FilterRule)
    private readonly repo: Repository<P3FilterRule>,
  ) {}

  findAll() {
    return this.repo.find({ order: { order: 'ASC' } });
  }

  findActive() {
    return this.repo.find({ where: { isActive: true }, order: { order: 'ASC' } });
  }

  findOne(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  private normalizeArray(value: unknown): string[] {
    const source = Array.isArray(value)
      ? value
      : typeof value === 'string'
        ? value.split(',')
        : [];
    return Array.from(
      new Set(
        source
          .map((v) => String(v || '').trim().toLowerCase())
          .filter(Boolean),
      ),
    );
  }

  private sanitize(data: Partial<P3FilterRule>) {
    const filterMode = String(data.filterMode || 'EXCLUDE').toUpperCase();
    if (filterMode !== 'EXCLUDE' && filterMode !== 'ALLOW_ONLY') {
      throw new BadRequestException(
        "filterMode doit être 'EXCLUDE' ou 'ALLOW_ONLY'.",
      );
    }

    const sourceCategory = data.sourceCategory
      ? String(data.sourceCategory).trim().toLowerCase()
      : null;
    const sourceSlugs = this.normalizeArray(data.sourceSlugs);
    const targetSlugs = this.normalizeArray(data.targetSlugs);
    const targetCategories = this.normalizeArray(data.targetCategories);
    const maxLevelOrder =
      data.maxLevelOrder === null ||
      data.maxLevelOrder === undefined
        ? null
        : Number(data.maxLevelOrder);
    const order =
      data.order === null || data.order === undefined
        ? 0
        : Number(data.order);

    if (!data.name || !String(data.name).trim()) {
      throw new BadRequestException('Le nom de la règle est obligatoire.');
    }
    if (!sourceCategory && sourceSlugs.length === 0) {
      throw new BadRequestException(
        'Définissez au moins une condition source (catégorie ou slugs).',
      );
    }
    if (targetSlugs.length === 0 && targetCategories.length === 0) {
      throw new BadRequestException(
        'Définissez au moins une cible (catégories ou slugs).',
      );
    }
    if (
      maxLevelOrder !== null &&
      (!Number.isFinite(maxLevelOrder) || maxLevelOrder < 0)
    ) {
      throw new BadRequestException('maxLevelOrder doit être un nombre >= 0.');
    }
    if (!Number.isFinite(order) || order < 0) {
      throw new BadRequestException('order doit être un nombre >= 0.');
    }

    return {
      name: String(data.name).trim(),
      sourceCategory,
      sourceSlugs,
      maxLevelOrder,
      filterMode,
      targetSlugs,
      targetCategories,
      isActive: data.isActive !== false,
      order,
    } as Partial<P3FilterRule>;
  }

  create(data: Partial<P3FilterRule>) {
    const rule = this.repo.create(this.sanitize(data));
    return this.repo.save(rule);
  }

  async update(id: string, data: Partial<P3FilterRule>) {
    await this.repo.update(id, this.sanitize(data));
    return this.repo.findOne({ where: { id } });
  }

  async remove(id: string) {
    await this.repo.delete(id);
    return { deleted: true };
  }
}
