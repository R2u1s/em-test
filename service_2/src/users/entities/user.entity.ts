import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import {
  IsInt,
  IsString,
  Min,
  IsNotEmpty,
  Length,
  IsUrl,
  IsEmail,
  IsBoolean,
} from 'class-validator';


@Entity()
export class User {
  // поле id
  @IsInt()
  @Min(0)
  @PrimaryGeneratedColumn()
  id: number;

  // поле firstname
  @Column({
    type: 'varchar'
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 30)
  firstname: string;

  // поле lastname
  @Column({
    type: 'varchar'
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 30)
  lastname: string;

  // поле age
  @Column({
    type: 'numeric'
  })
  @IsInt()
  @IsNotEmpty()
  @Min(18)
  age: number;

  // поле sex
  @Column({
    type: 'varchar'
  })
  @IsString()
  @IsNotEmpty()
  @Length(4, 6)
  sex: string;

  // поле problem
  @Column({
    type: 'boolean'
  })
  @IsBoolean()
  @IsNotEmpty()
  problem: boolean;

}
