import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRestaurantAccess, AuthError } from "@/lib/authz";

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export async function GET(_request: Request, context: { params: Promise<{ restaurantId: string }> }) {
  const { restaurantId } = await context.params;

  try {
    await requireRestaurantAccess(restaurantId);
  } catch (err) {
    if (err instanceof AuthError) return new NextResponse("Non autorisé", { status: 403 });
    throw err;
  }

  const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
  if (!restaurant) return new NextResponse("Introuvable", { status: 404 });

  const plays = await prisma.play.findMany({
    where: { restaurantId, email: { not: null } },
    orderBy: { createdAt: "desc" },
    include: { prize: true },
  });

  const header = ["email", "optin_marketing", "date", "lot", "code", "recupere"];
  const rows = plays.map((p) =>
    [
      p.email ?? "",
      p.optin ? "oui" : "non",
      p.createdAt.toISOString(),
      p.prize?.label ?? "",
      p.code ?? "",
      p.redeemed ? "oui" : "non",
    ]
      .map((v) => csvEscape(String(v)))
      .join(",")
  );
  const csv = [header.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${restaurant.slug}-emails.csv"`,
    },
  });
}
