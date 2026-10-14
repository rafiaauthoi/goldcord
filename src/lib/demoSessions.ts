export type DemoSession = {
  org: string;
  task: string;
  hours: number;
};

export const DEMO_GOAL = 20;
export const HAND_SIZE = 6;

export const DEMO_POOL: DemoSession[] = [
  { org: "Stark Industries", task: "Gave a lab tour to elementary students", hours: 3 },
  { org: "Hogsmeade", task: "Stacked candy at Honeydukes", hours: 2 },
  { org: "Men of Letters Bunker", task: "Sorted cursed objects", hours: 4.5 },
  { org: "Pawnee Parks Department", task: "Filled in the pit at Lot 48", hours: 3 },
  { org: "Central Perk", task: "Ran open mic night", hours: 2 },
  { org: "Starfleet Academy", task: "Tutored first-year cadets", hours: 5.5 },
  { org: "The Burrow", task: "De-gnomed the garden", hours: 1.5 },
  { org: "The Jasmine Dragon", task: "Served tea at a senior center", hours: 2 },
  { org: "Hawkins AV Club", task: "Fixed walkie-talkies for the science fair", hours: 2.5 },
  { org: "Camp Half-Blood", task: "Taught archery to new campers", hours: 3 },
  { org: "The 99th Precinct", task: "Ran the Halloween Heist fundraiser", hours: 3.5 },
  { org: "Wakanda Outreach Center", task: "Taught a weekend coding camp", hours: 4 },
  { org: "Dunder Mifflin Scranton", task: "Donated paper to the school library", hours: 1.5 },
  { org: "Bob's Burgers", task: "Cooked Burger of the Day for a food drive", hours: 2.5 },
  { org: "The Shire", task: "Cleaned up after a birthday party", hours: 3.5 },
  { org: "Monsters, Inc.", task: "Collected laughs for the power drive", hours: 2 },
  { org: "Jedi Temple", task: "Taught younglings to meditate", hours: 3 },
  { org: "Rivendell", task: "Organized the council archives", hours: 2.5 },
  { org: "The Krusty Krab", task: "Washed dishes for charity night", hours: 1.5 },
  { org: "Gotham Public Library", task: "Shelved returns after hours", hours: 2 },
  { org: "Hill Valley High", task: "Restored the clock tower", hours: 4 },
  { org: "Mystery Shack", task: "Gave honest tours, for once", hours: 2.5 },
  { org: "Avengers Compound", task: "Hosted a family open house", hours: 3 },
  { org: "Sunnydale High Library", task: "Re-shelved the restricted section", hours: 2 },
  { org: "Schitt's Creek Town Hall", task: "Painted the welcome sign", hours: 1.5 },
  { org: "Baker Street", task: "Returned lost items to their owners", hours: 3.5 },
];

function shuffled<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function dealHand(exclude: string[] = []): DemoSession[] {
  const skip = new Set(exclude);
  const available = DEMO_POOL.filter((session) => !skip.has(session.org));
  for (let attempt = 0; attempt < 8000; attempt += 1) {
    const hand = shuffled(available).slice(0, HAND_SIZE);
    const total = hand.reduce((sum, session) => sum + session.hours, 0);
    if (total === DEMO_GOAL) return hand;
  }
  return DEMO_POOL.slice(0, HAND_SIZE);
}

export function formatHours(hours: number) {
  return Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
}