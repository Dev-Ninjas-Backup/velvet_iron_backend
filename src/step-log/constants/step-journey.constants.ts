export interface JourneyLandmark {
  percentage: number;
  name: string;
  type: 'MARKER' | 'LANDMARK' | 'CAMP' | 'DESTINATION';
  title: string;
  lore: string;
  companionQuote: Record<string, string>;
}

export const JOURNEY_MILESTONES: JourneyLandmark[] = [
  {
    percentage: 25,
    name: 'The Old Boundary Stone',
    type: 'MARKER',
    title: 'Crossing the Frontier',
    lore: 'An ancient carved marker marking the boundary of the civilized valley. Beyond here, the untamed wilderness stretches.',
    companionQuote: {
      riven: 'The comfortable road is behind us now, darling. Keep your wits sharp.',
      thyra: 'First quarter completed. Your stride is steady, warrior.',
      leon: 'Initial checkpoint reached on schedule. Maintain pace.',
      visepheron: 'The first league is always crossed one steady footfall at a time.',
    },
  },
  {
    percentage: 50,
    name: 'Sunstone Spring',
    type: 'LANDMARK',
    title: 'Midway Oasis',
    lore: 'Warm crystalline water bubbles from deep fissures in the rock. Travelers historically stopped here to refill their flasks.',
    companionQuote: {
      riven: 'Halfway. You look marginally less exhausted than I anticipated.',
      thyra: 'Sunstone Spring! Drink deep and rest your feet for a brief moment.',
      leon: 'Midpoint reached. Tactical assessment: good endurance.',
      visepheron: 'The sun sits directly above. You have walked half a kingdom today.',
    },
  },
  {
    percentage: 75,
    name: 'The Ridge of Watchers',
    type: 'LANDMARK',
    title: 'High Lookout',
    lore: 'Craggy sentinels of stone overlooking the lower valley. From this height, the towers of the destination loom clearly.',
    companionQuote: {
      riven: 'Look ahead. The destination is almost within grasp. Do not disappoint me now.',
      thyra: 'The high ground is ours! Only one final march remaining.',
      leon: 'Final push ahead. Close the distance and finish strong.',
      visepheron: 'Even towering mountains yield to the persistent traveler.',
    },
  },
  {
    percentage: 100,
    name: 'The Sunken Citadel',
    type: 'DESTINATION',
    title: 'Objective Secured',
    lore: 'The ancient stone arches rise in triumphant welcome. Your boots are coated in dust, but your name is remembered here.',
    companionQuote: {
      riven: 'You made it. A truly respectable march. Now, take your rest before I demand more.',
      thyra: 'The destination is won! Well marched, companion. Your shield is unbent.',
      leon: 'Objective secured. Mission parameters fully met. Outstanding discipline.',
      visepheron: 'You carried the flame across the whole world today. Rest in peace, little flame.',
    },
  },
];

export interface CanonicalMilestone {
  index: number; // 1 to 10
  name: string;
  stepsRequired: number;
  lore: string;
  companionQuote: Record<string, string>;
}

export const CANONICAL_EXPEDITION_MILESTONES: CanonicalMilestone[] = [
  {
    index: 1,
    name: 'The Whispering Woods',
    stepsRequired: 25000,
    lore: 'Ancient silverbarks murmur as the wind sweeps through the canopy. The first threshold of the Grand Journey is breached.',
    companionQuote: {
      riven: 'The trees whisper secrets of ancient kings. Keep your focus on the road, darling.',
      thyra: 'The first frontier is crossed! Your boots tread true, warrior.',
      leon: 'Initial landmark logged: 25,000 steps. Pace is disciplined and steady.',
      visepheron: 'The forest bows to your quiet resolve. Step by step, the journey unfolds.',
    },
  },
  {
    index: 2,
    name: 'Mistveil Crossing',
    stepsRequired: 75000,
    lore: 'A perpetual veil of luminescent fog shrouds the riverbanks. Only determined wanderers see the path ahead.',
    companionQuote: {
      riven: 'Fog and shadows. Do not let the mist cloud your ambition.',
      thyra: 'Through the mist we march! No river shall halt our forward stride.',
      leon: 'Visibility reduced, but velocity remains optimal. Checkpoint 2 cleared.',
      visepheron: 'The water sings of travelers long gone. You carry their spirit forward.',
    },
  },
  {
    index: 3,
    name: 'Old Stonewatch Fort',
    stepsRequired: 150000,
    lore: 'Weathered ramparts standing vigil over the northern valley for centuries. A fortress carved from bedrock.',
    companionQuote: {
      riven: 'Ancient stones, broken shields. History favors those who endure to the end.',
      thyra: 'Stonewatch stands firm, just like our resolve! Look at that view.',
      leon: 'Defensible position reached. 150,000 steps logged without compromise.',
      visepheron: 'The stones remember every legion that marched here. Today they remember you.',
    },
  },
  {
    index: 4,
    name: 'Moonlit Ridge',
    stepsRequired: 250000,
    lore: 'High crags bathed in the eternal glow of the twin moons. The air is crisp and the horizon vast.',
    companionQuote: {
      riven: 'A quarter of a million strides beneath the stars. Truly elegant endurance.',
      thyra: 'Feel the night air! We climb ever higher toward glory.',
      leon: 'Elevation climbing. Endurance metrics exceeding expectations.',
      visepheron: 'The moonlight guides those who walk with purpose in their hearts.',
    },
  },
  {
    index: 5,
    name: 'Ashen Hollow',
    stepsRequired: 375000,
    lore: 'Gray obsidian sands and smoldering geysers. A proving ground where only the resilient survive.',
    companionQuote: {
      riven: 'A harsh wasteland. But you carry yourself through the ash with poise.',
      thyra: 'Heat and dust! Let the ashes temper your spirit like folded iron.',
      leon: 'Environmental hazard traversed safely. Milestone 5 achieved.',
      visepheron: 'From ash, life inevitably blooms again. Keep walking, traveler.',
    },
  },
  {
    index: 6,
    name: 'Sunken Bastion',
    stepsRequired: 500000,
    lore: 'Half a million steps deep into the realm. Half-submerged marble columns reflect forgotten dynasties.',
    companionQuote: {
      riven: 'Half a million steps. You are proving far more formidable than I dreamed.',
      thyra: 'Five hundred thousand! A halfway triumph worthy of song and feast!',
      leon: 'Mission midpoint secured: 500,000 steps. Morale and discipline peak.',
      visepheron: 'The halfway bell tolls across the earth. Half a realm behind you.',
    },
  },
  {
    index: 7,
    name: 'Windswept Plateau',
    stepsRequired: 625000,
    lore: 'Vast grasslands dancing beneath unrelenting gales. The sky feels infinite in every direction.',
    companionQuote: {
      riven: 'The wind tests our poise, yet you stand tall and unapologetic.',
      thyra: 'Lean into the gale! Let the wind push you ever forward!',
      leon: 'Aerodynamic resistance logged. Ground coverage remains uninterrupted.',
      visepheron: 'The winds carry whispers of the great peaks awaiting in the distance.',
    },
  },
  {
    index: 8,
    name: 'Frostpine Pass',
    stepsRequired: 750000,
    lore: 'Permafrost clings to ancient needlewoods. Snow crunches beneath your boots in the high corridor.',
    companionQuote: {
      riven: 'A chill in the air, but the fire inside your stride is unmistakable.',
      thyra: 'Cold iron and frosted pines! We are three-quarters to the edge of the world!',
      leon: 'Sub-zero temperatures logged. Three-quarters of the grand march completed.',
      visepheron: 'The snow preserves the memory of every step you take.',
    },
  },
  {
    index: 9,
    name: "High Dragon's Roost",
    stepsRequired: 875000,
    lore: 'Towering volcanic pinnacles where legends once took wing. The edge of the world is within sight.',
    companionQuote: {
      riven: 'Look down from this height, darling. You have walked an entire continent.',
      thyra: 'The roost of legends! One final push and the world itself is conquered!',
      leon: 'Target proximity immediate. Final 125,000 steps remaining.',
      visepheron: 'Even ancient dragons would pause to honor a march of this magnitude.',
    },
  },
  {
    index: 10,
    name: "The World's Edge",
    stepsRequired: 1000000,
    lore: 'The culmination of The Long March. One million steps completed. You stand at the boundary of reality.',
    companionQuote: {
      riven: 'One million steps. You did not just survive the journey—you mastered it. I am proud.',
      thyra: 'ONE MILLION STEPS! The grand march is conquered! You are a living legend!',
      leon: 'Operation complete. 1,000,000 steps logged. Unequivocal excellence.',
      visepheron: "The circle of the earth is complete. You walked to the world's edge and claimed it.",
    },
  },
];

export function getUnlockedExpeditionMilestone(lifetimeSteps: number): CanonicalMilestone | null {
  const reached = CANONICAL_EXPEDITION_MILESTONES.filter((m) => lifetimeSteps >= m.stepsRequired);
  return reached.length > 0 ? reached[reached.length - 1] : null;
}

export function getNextExpeditionMilestone(lifetimeSteps: number): CanonicalMilestone | null {
  return CANONICAL_EXPEDITION_MILESTONES.find((m) => lifetimeSteps < m.stepsRequired) || null;
}
