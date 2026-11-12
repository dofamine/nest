import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MaxLength(255)
  @MinLength(8)
  password: string;

  @IsNotEmpty()
  @IsString()
  invitationId: string;
}
