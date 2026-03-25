export const levelStatus = (level:number) => {
  const titles = [
    // Tier I (1–7)
    "Unbound", "Initiate", "Novice", "Disciple", "Acolyte", "Adept", "Bound",

    // Tier II (8–15)
    "Aspirant", "Pathfinder", "Vanguard", "Oathbound", "Waymarked",
    "Waymarked II", "Waymarked III", "Waymarked IV",

    // Tier III (16–25)
    "Veteran", "Sentinel", "Ironbound", "Hardened", "Proven",
    "Proven II", "Proven III", "Proven IV", "Proven V", "Proven VI",

    // Tier IV (26–35)
    "Elite", "Champion", "Paragon", "Exemplar", "Ascendant",
    "Ascendant II", "Ascendant III", "Ascendant IV", "Ascendant V", "Ascendant VI",

    // Tier V (36–45)
    "Ascended", "Mythic", "Eternal", "Transcendent", "Unyielding",
    "Unyielding II", "Unyielding III", "Unyielding IV", "Unyielding V", "Unyielding VI",

    // Tier VI (46–50)
    "Legend", "Warden", "High Sovereign", "Ironbound Legend", "Ironbound Legend II"
  ];

  if (level < 1 || level > 50) return "Invalid Level";

  return titles[level - 1];
};