export const calculateLevel = (xp: number): number => {
  const level =
    Math.floor((Number(xp) - 400) / 150) + 1 >= 50
      ? 50
      : Math.floor((Number(xp) - 400) / 150) + 1 < 1
        ? 1
        : Math.floor((Number(xp) - 400) / 150) + 1;
  return level;
};

export const availableThemesForLevel = (
  level: number,
  length: number,
): boolean => {
  const result =
    level >= 30 && length <= 3
      ? true
      : level >= 20 && length <= 2
        ? true
        : level >= 10 && length <= 1
          ? true
          : level < 10 && length < 1
            ? true
            : false;
  console.log(result);

  return result;
};
export const availableCompanionForLevel = (
  level: number,
  length: number,
): boolean => {
  const result = level >= 32 && length <= 3
    ? true
    : level >= 22 && length <= 2
      ? true
      : level >= 12 && length <= 1
        ? true
        : level < 10 && length < 1
          ? true
          : false;
  console.log(result);
  return result;
};