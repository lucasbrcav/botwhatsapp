import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateCommandDto {
  @IsString()
  trigger: string;

  @IsString()
  payload: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsString()
  allowedScopes?: string;
}

export class UpdateCommandDto {
  @IsOptional()
  @IsString()
  payload?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsString()
  allowedScopes?: string;
}
