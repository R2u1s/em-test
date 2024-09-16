import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import {
  IsBoolean,
  IsNotEmpty
} from 'class-validator';

export class UpdateUserDto extends PartialType(CreateUserDto) {

  @IsBoolean()
  @IsNotEmpty()
  problem: boolean;

}
