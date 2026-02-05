export const calculateLevel = (xp: number): number => {
  const level =
    Math.floor((Number(xp) - 400) / 150) + 1 >= 50
      ? 50
      : Math.floor((Number(xp) - 400) / 150) + 1 < 1
        ? 1
        : Math.floor((Number(xp) - 400) / 150) + 1;
  return level;
};
