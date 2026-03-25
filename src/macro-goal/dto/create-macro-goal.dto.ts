import { IsString, IsNumber, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateMacroGoalDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsNumber()
    @IsNotEmpty()
    carbs: number;

    @IsNumber()
    @IsNotEmpty()
    fat: number;

    @IsNumber()
    @IsNotEmpty()
    protein: number;
}
