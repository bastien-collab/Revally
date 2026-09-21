import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, context: { params: Promise<{ restaurantId: string }> }) {
  const { restaurantId } = await context.params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { logo: true, logoType: true },
  });

  if (!restaurant?.logo || !restaurant.logoType) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(new Uint8Array(restaurant.logo), {
    headers: {
      "Content-Type": restaurant.logoType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
