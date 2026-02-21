import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from '../entities/setting.entity';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Setting)
    private settingRepo: Repository<Setting>,
  ) {}

  async findAll() {
    return this.settingRepo.find();
  }

  async findOne(key: string) {
    return this.settingRepo.findOne({ where: { key } });
  }

  async update(key: string, value: string) {
    let setting = await this.findOne(key);
    if (!setting) {
      setting = this.settingRepo.create({ key, value });
    } else {
      setting.value = value;
    }
    return this.settingRepo.save(setting);
  }

  async getValue(key: string, defaultValue: string = ''): Promise<string> {
    const setting = await this.findOne(key);
    return setting ? setting.value : defaultValue;
  }
}
