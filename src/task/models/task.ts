import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import { PartialType, PickType } from '@nestjs/mapped-types';
import { ETaskArea } from '../../generated/prisma/enums.js';

export class TaskDTO {
  @IsOptional()
  @IsInt()
  @IsPositive()
  priority?: number;

  @IsNotEmpty()
  @IsString({ message: 'field should be a string' })
  @Length(2, 255)
  name: string;

  @IsBoolean()
  completed: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ArrayNotEmpty()
  tags?: string[];

  @IsOptional()
  @IsEnum(ETaskArea)
  area?: ETaskArea;

  @Matches(/^[0-9]{4,6}$/)
  @IsOptional()
  pin?: string;
}

export class CreateTaskDTO extends PickType(TaskDTO, [
  'name',
  'tags',
  'area',
  'priority',
  'pin',
] as const) {}

export class UpdateTaskDTO extends PartialType(TaskDTO) {}
