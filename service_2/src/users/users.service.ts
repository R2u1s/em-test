import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from '../users/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) { }
  async findAll(): Promise<User[]> {
    return await this.userRepository.find();
  }

  async update(id: number): Promise<number> {
    // Получить количество записей, где problem равно true
    const count = await this.userRepository.count({ where: { problem: true } });

    // Обновить поле problem на false
    await this.userRepository.update(id, { problem: false });

    return count;
  }

}
