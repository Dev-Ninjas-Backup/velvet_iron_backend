import { IsString, IsNumber, IsOptional } from 'class-validator';

export class UpdateMacroGoalDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsNumber()
    @IsOptional()
    carbs?: number;

    @IsNumber()
    @IsOptional()
    fat?: number;

    @IsNumber()
    @IsOptional()
    protein?: number;
}
