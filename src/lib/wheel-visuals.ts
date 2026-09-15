// Purely visual mapping shared by the client wheel component. Segment colors
// follow a fixed 4-step pattern baked into the original design's conic-gradient
// (gold / white / purple / white, repeating), independent of prize content —
// this keeps the wheel geometry and "4 cases gagnantes sur 8" copy accurate
// no matter what a restaurant configures its prize labels to.
export const SEGMENT_COUNT = 8;

export type SegmentStyle = {
  bg: string;
  color: string;
  fontWeight: number;
  fontSize: number;
};

const STYLE_BY_MOD: SegmentStyle[] = [
  { bg: "#E8A33D", color: "#2B1A00", fontWeight: 800, fontSize: 13 }, // mod 0 — gold
  { bg: "#FFFFFF", color: "#5F5B7A", fontWeight: 700, fontSize: 12 }, // mod 1 — white/lose
  { bg: "#5B4AEE", color: "#FFFFFF", fontWeight: 800, fontSize: 13 }, // mod 2 — purple
  { bg: "#FFFFFF", color: "#5F5B7A", fontWeight: 700, fontSize: 12 }, // mod 3 — white/lose
];

export function getSegmentStyle(position: number): SegmentStyle {
  return STYLE_BY_MOD[position % 4];
}

// Even positions (0,2,4,6) are the four configurable "prize" slots; odd
// positions (1,3,5,7) are the four fixed "Rien cette fois" slots.
export function isPrizeSlot(position: number): boolean {
  return position % 2 === 0;
}

export const LOSE_LABEL = "Rien cette fois";
export const LOSE_EMOJI = "🤞";
