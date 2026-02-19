export const CANVAS_WIDTH = 1000;
export const CANVAS_HEIGHT = 560;

// Table visual boundaries (outer wood frame)
export const TABLE_OUTER_LEFT = 55;
export const TABLE_OUTER_TOP = 55;
export const TABLE_OUTER_RIGHT = 945;
export const TABLE_OUTER_BOTTOM = 505;

// Play area (where balls live - inside the cushions)
export const PLAY_LEFT = 102;
export const PLAY_RIGHT = 898;
export const PLAY_TOP = 95;
export const PLAY_BOTTOM = 465;

export const PLAY_WIDTH = PLAY_RIGHT - PLAY_LEFT;
export const PLAY_HEIGHT = PLAY_BOTTOM - PLAY_TOP;
export const PLAY_CENTER_X = (PLAY_LEFT + PLAY_RIGHT) / 2;
export const PLAY_CENTER_Y = (PLAY_TOP + PLAY_BOTTOM) / 2;

// Ball physics
export const BALL_RADIUS = 11;
export const FRICTION = 0.9875;
export const MIN_SPEED = 0.08;
export const MAX_POWER = 20;
export const POWER_CHARGE_RATE = 0.25; // per frame

// Pocket
export const POCKET_RADIUS = 20;

export const POCKET_POSITIONS: { x: number; y: number }[] = [
  { x: PLAY_LEFT,        y: PLAY_TOP    },   // TL
  { x: PLAY_CENTER_X,   y: PLAY_TOP - 5 },   // TM
  { x: PLAY_RIGHT,      y: PLAY_TOP    },   // TR
  { x: PLAY_LEFT,       y: PLAY_BOTTOM },   // BL
  { x: PLAY_CENTER_X,   y: PLAY_BOTTOM + 5 }, // BM
  { x: PLAY_RIGHT,      y: PLAY_BOTTOM },   // BR
];

// Ball colors (hex)
export const BALL_COLORS: Record<number, number> = {
  0: 0xF5F5F5,  // cue ball - white
  1: 0xF5C518,  // yellow
  2: 0x1A56DB,  // blue
  3: 0xE02424,  // red
  4: 0x7E3AF2,  // purple
  5: 0xF97316,  // orange
  6: 0x16A34A,  // green
  7: 0x9F1239,  // maroon
  8: 0x111827,  // black
  9: 0xF5C518,  // yellow stripe
  10: 0x1A56DB, // blue stripe
  11: 0xE02424, // red stripe
  12: 0x7E3AF2, // purple stripe
  13: 0xF97316, // orange stripe
  14: 0x16A34A, // green stripe
  15: 0x9F1239, // maroon stripe
};

// Rack positions (15 balls in triangle, apex left pointing right)
// Ball rows from left (apex) to right
const R = BALL_RADIUS;
const DX = R * Math.sqrt(3); // ~19.05
const RACK_APEX_X = 680;
const RACK_APEX_Y = PLAY_CENTER_Y;

export const RACK_POSITIONS: { x: number; y: number; ballNum: number }[] = [
  // Row 1 (apex)
  { x: RACK_APEX_X,           y: RACK_APEX_Y,               ballNum: 1  },
  // Row 2
  { x: RACK_APEX_X + DX,      y: RACK_APEX_Y - R,           ballNum: 9  },
  { x: RACK_APEX_X + DX,      y: RACK_APEX_Y + R,           ballNum: 2  },
  // Row 3
  { x: RACK_APEX_X + DX * 2,  y: RACK_APEX_Y - R * 2,      ballNum: 3  },
  { x: RACK_APEX_X + DX * 2,  y: RACK_APEX_Y,              ballNum: 8  }, // 8-ball center
  { x: RACK_APEX_X + DX * 2,  y: RACK_APEX_Y + R * 2,      ballNum: 10 },
  // Row 4
  { x: RACK_APEX_X + DX * 3,  y: RACK_APEX_Y - R * 3,      ballNum: 4  },
  { x: RACK_APEX_X + DX * 3,  y: RACK_APEX_Y - R,           ballNum: 11 },
  { x: RACK_APEX_X + DX * 3,  y: RACK_APEX_Y + R,           ballNum: 5  },
  { x: RACK_APEX_X + DX * 3,  y: RACK_APEX_Y + R * 3,      ballNum: 12 },
  // Row 5
  { x: RACK_APEX_X + DX * 4,  y: RACK_APEX_Y - R * 4,      ballNum: 6  },  // corner solid
  { x: RACK_APEX_X + DX * 4,  y: RACK_APEX_Y - R * 2,      ballNum: 13 },
  { x: RACK_APEX_X + DX * 4,  y: RACK_APEX_Y,              ballNum: 7  },
  { x: RACK_APEX_X + DX * 4,  y: RACK_APEX_Y + R * 2,      ballNum: 14 },
  { x: RACK_APEX_X + DX * 4,  y: RACK_APEX_Y + R * 4,      ballNum: 15 }, // corner stripe
];

// Cue ball break position
export const CUE_BALL_START_X = 240;
export const CUE_BALL_START_Y = PLAY_CENTER_Y;
