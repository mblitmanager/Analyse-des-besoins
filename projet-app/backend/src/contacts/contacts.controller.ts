import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { Contact } from '../entities/contact.entity';

@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  create(@Body() body: Partial<Contact>) {
    return this.contactsService.create(body);
  }

  @Get()
  findAll() {
    return this.contactsService.findAll();
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: Partial<Contact>) {
    return this.contactsService.update(+id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.contactsService.remove(+id);
  }
}
