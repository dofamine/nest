import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PickType } from '@nestjs/mapped-types';

export class SubtaskDTO {
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}

export class CreateSubtaskDTO extends PickType(SubtaskDTO, ['name']) {}

export class UpdateSubtaskDTO extends PickType(SubtaskDTO, [
  'name',
  'completed',
]) {}
