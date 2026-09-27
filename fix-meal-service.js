const fs = require('fs');
let service = fs.readFileSync('src/meal-log/meal-log.service.ts', 'utf8');

// Fix createMealLog
const createTarget = `    const calories = this.calculateCalories(
      Number(dto.carbs),
      Number(dto.protein),
      Number(dto.fats),
    );`;

const createReplacement = `    const calories = dto.calories !== undefined && dto.calories > 0
      ? Number(dto.calories)
      : this.calculateCalories(
          Number(dto.carbs),
          Number(dto.protein),
          Number(dto.fats),
        );`;
        
service = service.replace(createTarget, createReplacement);

// Fix updateMealLog
const updateTarget = `    // 3️⃣ Recalculate calories
    const calories = this.calculateCalories(
      carbs ?? 0,
      protein ?? 0,
      fats ?? 0,
    );`;
    
const updateReplacement = `    // 3️⃣ Recalculate or override calories
    let calories: number;
    if (dto.calories !== undefined && dto.calories > 0) {
      calories = Number(dto.calories);
    } else if (dto.calories === 0) {
      calories = this.calculateCalories(carbs ?? 0, protein ?? 0, fats ?? 0);
    } else if (log.calories !== null && log.calories > 0 && dto.carbs === undefined && dto.protein === undefined && dto.fats === undefined) {
      // Keep existing override if macros weren't changed
      calories = log.calories;
    } else {
      calories = this.calculateCalories(carbs ?? 0, protein ?? 0, fats ?? 0);
    }`;

service = service.replace(updateTarget, updateReplacement);

fs.writeFileSync('src/meal-log/meal-log.service.ts', service);
