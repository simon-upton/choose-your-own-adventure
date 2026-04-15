/**
 * Inline seed data — mirrors data/seed/cot-minimal-subset.json
 * Kept as a JS export so the app works without a local HTTP server.
 */
export const SEED_FRAGMENTS = [
  {
    id: 2,
    title: "Snake Canyon Entrance",
    text: "You've hiked through Snake Canyon once before while visiting your Uncle Howard at Red Creek Ranch, but you never noticed any cave entrance. It looks as though a recent rock slide has uncovered it.\n\nThough the late afternoon sun is striking the opening of the cave, the interior remains in total darkness. You step inside a few feet, trying to get an idea of how big it is. As your eyes become used to the dark, you see what looks like a tunnel ahead, dimly lit by some kind of phosphorescent material on its walls.",
    choices: [
      { text: "Venture deeper into the tunnel.", targetId: 3 }
    ],
    metadata: {
      source: "cot-seed", revision: 1,
      createdAt: "2026-04-14T20:00:00Z", updatedAt: "2026-04-14T20:00:00Z",
      author: "system"
    },
    tags: ["intro", "cave"]
  },
  {
    id: 3,
    title: "Strange Tunnel",
    text: "The tunnel walls are shaped by running water. After twenty feet or so, the tunnel curves. You wonder where it leads. You venture in a bit further, but you feel nervous being alone in such a strange place. You turn and hurry out.\n\nA thunderstorm may be coming, judging by how dark it looks outside. Suddenly you realize the sun has long since set, and the landscape is lit only by the pale light of the full moon. You must have fallen asleep and woken up hours later. But then you remember something even more strange. Just last evening, the moon was only a slim crescent in the sky.\n\nYou wonder how long you've been in the cave. You are not hungry. You don't feel you have been sleeping.",
    choices: [
      { text: "Start back home by moonlight.", targetId: 4 },
      { text: "Wait for dawn.", targetId: 5 }
    ],
    metadata: {
      source: "cot-seed", revision: 1,
      createdAt: "2026-04-14T20:00:00Z", updatedAt: "2026-04-14T20:00:00Z",
      author: "system"
    },
    tags: ["mystery", "time-warp"]
  },
  {
    id: 4,
    title: "Dangerous Trail",
    text: "You decide the risk of losing your footing on the steep and rocky trail is too great in the moonlight. You carefully make your way down the mountainside.",
    choices: [],
    metadata: {
      source: "cot-seed", revision: 1,
      createdAt: "2026-04-14T20:00:00Z", updatedAt: "2026-04-14T20:00:00Z",
      author: "system"
    },
    tags: ["terminal", "escape"]
  },
  {
    id: 5,
    title: "Morning Approaches",
    text: "You wait until morning, but, as the rosy wisps of dawn begin to light the eastern sky, a chill and forbidding wind begins to blow.",
    choices: [
      { text: "Seek shelter in the rocks.", targetId: 6 },
      { text: "Brave the freezing wind to explore.", targetId: 16 }
    ],
    metadata: {
      source: "cot-seed", revision: 1,
      createdAt: "2026-04-14T20:00:00Z", updatedAt: "2026-04-14T20:00:00Z",
      author: "system"
    },
    tags: ["decision-point"]
  },
  {
    id: 6,
    title: "Medieval Discovery",
    text: "You step into a niche in the rocks to escape the merciless blast of wind and lean back against the rock wall. Suddenly it crumbles under your weight, causing you to fall backward down a muddy slope and into a pond.\n\nThe sun shines brightly down on you as you pick yourself up, dripping wet, and wade to the grassy shore. While you are collecting your senses, a horse comes prancing up, its rider dressed in tin armor—a knight out of the history books. The horseman lifts off his helmet and laughs.",
    choices: [
      { text: "Accept the ride back to the castle.", targetId: 22 },
      { text: "Decline and try to find your way back into the Cave.", targetId: 114 }
    ],
    metadata: {
      source: "cot-seed", revision: 1,
      createdAt: "2026-04-14T20:00:00Z", updatedAt: "2026-04-14T20:00:00Z",
      author: "system"
    },
    tags: ["time-travel"]
  },
  {
    id: 16,
    title: "Ancient Landscape",
    text: "You brave the freezing wind and venture out to explore the strange landscape around you. The flora and fauna seem unlike anything from your own time.",
    choices: [],
    metadata: {
      source: "cot-seed", revision: 1,
      createdAt: "2026-04-14T20:00:00Z", updatedAt: "2026-04-14T20:00:00Z",
      author: "system"
    },
    tags: ["terminal", "exploration"]
  },
  {
    id: 22,
    title: "Castle Adventure",
    text: "You climb onto the back of the knight's horse and ride toward the medieval castle. As you approach, you realize this adventure is just beginning.",
    choices: [],
    metadata: {
      source: "cot-seed", revision: 1,
      createdAt: "2026-04-14T20:00:00Z", updatedAt: "2026-04-14T20:00:00Z",
      author: "system"
    },
    tags: ["terminal", "adventure"]
  },
  {
    id: 114,
    title: "Return Attempt",
    text: "You decline the knight's offer and attempt to find your way back to the cave entrance. The landscape seems to shift and change around you.",
    choices: [],
    metadata: {
      source: "cot-seed", revision: 1,
      createdAt: "2026-04-14T20:00:00Z", updatedAt: "2026-04-14T20:00:00Z",
      author: "system"
    },
    tags: ["terminal", "mystery"]
  }
];
