"use server";

import { prisma } from "@/lib/prisma";
import { pickWeightedPrize, generateCode, isValidEmail } from "@/lib/game";
import { sendCodeEmail } from "@/lib/email";

export type SpinResult =
  | { ok: true; playId: string; won: boolean; prizeLabel: string; position: number; code: string | null }
  | { ok: false; error: string };

export async function spinAction(restaurantSlug: string): Promise<SpinResult> {
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug: restaurantSlug },
    include: { prizes: { orderBy: { position: "asc" } } },
  });

  if (!restaurant || !restaurant.active) {
    return { ok: false, error: "Ce jeu n'est plus disponible." };
  }
  if (restaurant.prizes.length === 0) {
    return { ok: false, error: "La roue n'est pas encore configurée." };
  }

  const prize = pickWeightedPrize(restaurant.prizes);
  const won = prize.isWin;

  let code: string | null = null;
  let play;
  if (won) {
    // Retry on the (extremely unlikely) unique code collision.
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        code = generateCode();
        play = await prisma.play.create({
          data: { restaurantId: restaurant.id, prizeId: prize.id, won, code },
        });
        break;
      } catch (err: unknown) {
        code = null;
        if (attempt === 4) throw err;
      }
    }
  } else {
    play = await prisma.play.create({
      data: { restaurantId: restaurant.id, prizeId: prize.id, won },
    });
  }

  if (!play) return { ok: false, error: "Une erreur est survenue, réessayez." };

  return {
    ok: true,
    playId: play.id,
    won,
    prizeLabel: prize.label,
    position: prize.position,
    code,
  };
}

export type SubmitEmailResult = { ok: true } | { ok: false; error: string };

export async function submitEmailAction(
  playId: string,
  email: string,
  optin: boolean
): Promise<SubmitEmailResult> {
  const trimmed = email.trim();
  if (!isValidEmail(trimmed)) {
    return { ok: false, error: "Adresse email invalide." };
  }

  const play = await prisma.play.findUnique({
    where: { id: playId },
    include: { restaurant: true, prize: true },
  });
  if (!play || !play.won || !play.code) {
    return { ok: false, error: "Ce lot n'est pas valide." };
  }

  await prisma.play.update({
    where: { id: playId },
    data: { email: trimmed, optin },
  });

  await sendCodeEmail({
    playId: play.id,
    to: trimmed,
    restaurantName: play.restaurant.name,
    code: play.code,
    prizeLabel: play.prize?.label ?? "",
  });

  return { ok: true };
}

/**
 * Optional email capture on a losing play — no code to send, just lets the
 * restaurant grow its list even when nobody wins.
 */
export async function submitLoseEmailAction(
  playId: string,
  email: string,
  optin: boolean
): Promise<SubmitEmailResult> {
  const trimmed = email.trim();
  if (!isValidEmail(trimmed)) {
    return { ok: false, error: "Adresse email invalide." };
  }

  const play = await prisma.play.findUnique({ where: { id: playId } });
  if (!play || play.won) {
    return { ok: false, error: "Action non disponible." };
  }

  await prisma.play.update({
    where: { id: playId },
    data: { email: trimmed, optin },
  });

  return { ok: true };
}
