import "server-only";
import { randomInt } from "crypto";
import type { Prize } from "@prisma/client";

const CODE_ALPHABET = "ACDEFGHJKLMNPQRTUVWXY3479"; // no O/0/I/1/S/5/B/8 confusion

export function generateCode(): string {
  let s = "";
  for (let i = 0; i < 4; i++) s += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return "RV-" + s;
}

export function pickWeightedPrize(prizes: Prize[]): Prize {
  const total = prizes.reduce((sum, p) => sum + Math.max(0, p.weight), 0);
  if (total <= 0) return prizes[0];
  let r = randomInt(total) + 1;
  for (const p of prizes) {
    r -= Math.max(0, p.weight);
    if (r <= 0) return p;
  }
  return prizes[prizes.length - 1];
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(value.trim());
}

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}
