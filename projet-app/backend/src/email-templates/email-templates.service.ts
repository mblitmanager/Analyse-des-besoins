import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailTemplate } from '../entities/email-template.entity';

@Injectable()
export class EmailTemplatesService {
  constructor(
    @InjectRepository(EmailTemplate)
    private templateRepo: Repository<EmailTemplate>,
  ) {}

  async findAll(): Promise<EmailTemplate[]> {
    return this.templateRepo.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<EmailTemplate> {
    const template = await this.templateRepo.findOne({ where: { id } });
    if (!template) throw new NotFoundException('Template not found');
    return template;
  }

  async findBySlug(slug: string): Promise<EmailTemplate | null> {
    return this.templateRepo.findOne({ where: { slug, isActive: true } });
  }

  async create(data: Partial<EmailTemplate>): Promise<EmailTemplate> {
    const template = this.templateRepo.create(data);
    return this.templateRepo.save(template);
  }

  async update(id: string, data: Partial<EmailTemplate>): Promise<EmailTemplate> {
    const template = await this.findOne(id);
    Object.assign(template, data);
    return this.templateRepo.save(template);
  }

  async remove(id: string): Promise<void> {
    const template = await this.findOne(id);
    await this.templateRepo.remove(template);
  }

  /**
   * Renders a template by replacing {{variable}} placeholders with actual values.
   */
  renderTemplate(template: string, variables: Record<string, string>): string {
    let rendered = template;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      rendered = rendered.replace(regex, value || '');
    }
    // Remove any remaining unmatched placeholders
    rendered = rendered.replace(/\{\{\s*\w+\s*\}\}/g, '');
    return rendered;
  }

  /**
   * Gets a rendered template ready for sending.
   * Returns null if template doesn't exist or is inactive.
   */
  async getRendered(
    slug: string,
    variables: Record<string, string>,
  ): Promise<{ subject: string; html: string } | null> {
    const template = await this.findBySlug(slug);
    if (!template) return null;

    return {
      subject: this.renderTemplate(template.subject, variables),
      html: this.renderTemplate(template.htmlContent, variables),
    };
  }
}
