import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contact } from '../entities/contact.entity';

@Injectable()
export class ContactsService {
  constructor(
    @InjectRepository(Contact)
    private contactRepo: Repository<Contact>,
  ) {}

  create(data: Partial<Contact>) {
    return this.contactRepo.save(data as Contact);
  }

  findAll() {
    return this.contactRepo.find({ order: { createdAt: 'DESC' } });
  }
}
