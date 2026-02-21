import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class AppService {
  constructor(private dataSource: DataSource) {}

  getHello(): string {
    return 'Hello World!';
  }

  async checkDbConnection() {
    try {
      await this.dataSource.query('SELECT 1');
      return { status: 'ok', message: 'Database connection is successful' };
    } catch (error) {
      return {
        status: 'error',
        message: 'Database connection failed',
        error: error.message,
      };
    }
  }
}
