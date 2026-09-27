const fs = require('fs');

let createDto = fs.readFileSync('src/meal-log/dto/create-meal-log.dto.ts', 'utf8');
const createCaloriesField = `
    @ApiProperty({
        description: 'Calories in kcal (Optional override)',
        example: 300,
        required: false,
    })
    @IsInt()
    @Min(0)
    @IsOptional()
    @Type(() => Number)
    calories?: number;
`;
createDto = createDto.replace('loggedAt?: string;', 'loggedAt?: string;\n' + createCaloriesField);
fs.writeFileSync('src/meal-log/dto/create-meal-log.dto.ts', createDto);


let updateDto = fs.readFileSync('src/meal-log/dto/update-meal-log.dto.ts', 'utf8');
const updateCaloriesField = `
    @IsInt()
    @Min(0)
    @IsOptional()
    @Transform(({ value }) => (value === '' ? undefined : value))
    @Type(() => Number)
    calories?: number;
`;
updateDto = updateDto.replace('loggedAt?: string;', 'loggedAt?: string;\n' + updateCaloriesField);
fs.writeFileSync('src/meal-log/dto/update-meal-log.dto.ts', updateDto);
