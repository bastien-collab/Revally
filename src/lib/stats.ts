import "server-only";
import { prisma } from "@/lib/prisma";

export async function getRestaurantStats(restaurantId: string) {
  const [totalPlays, totalWins, totalRedeemed, prizes, recentPlays, optinCount] = await Promise.all([
    prisma.play.count({ where: { restaurantId } }),
    prisma.play.count({ where: { restaurantId, won: true } }),
    prisma.play.count({ where: { restaurantId, won: true, redeemed: true } }),
    prisma.prize.findMany({
      where: { restaurantId },
      orderBy: { position: "asc" },
      include: { _count: { select: { plays: true } } },
    }),
    prisma.play.findMany({
      where: { restaurantId },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { prize: true },
    }),
    prisma.play.count({ where: { restaurantId, optin: true, email: { not: null } } }),
  ]);

  return {
    totalPlays,
    totalWins,
    totalLosses: totalPlays - totalWins,
    winRate: totalPlays > 0 ? totalWins / totalPlays : 0,
    totalRedeemed,
    pendingRedeem: totalWins - totalRedeemed,
    prizes,
    recentPlays,
    optinCount,
  };
}

export type RestaurantStats = Awaited<ReturnType<typeof getRestaurantStats>>;

export async function getAllRestaurantsOverview() {
  const restaurants = await prisma.restaurant.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { plays: true, users: true } } },
  });

  const winsByRestaurant = await prisma.play.groupBy({
    by: ["restaurantId"],
    where: { won: true },
    _count: { _all: true },
  });
  const winsMap = new Map(winsByRestaurant.map((w) => [w.restaurantId, w._count._all]));

  return restaurants.map((r) => ({
    ...r,
    totalPlays: r._count.plays,
    totalUsers: r._count.users,
    totalWins: winsMap.get(r.id) ?? 0,
  }));
}

export async function getGlobalOverview() {
  const [totalRestaurants, activeRestaurants, totalPlays, totalWins, totalOptins] = await Promise.all([
    prisma.restaurant.count(),
    prisma.restaurant.count({ where: { active: true } }),
    prisma.play.count(),
    prisma.play.count({ where: { won: true } }),
    prisma.play.count({ where: { optin: true, email: { not: null } } }),
  ]);

  return { totalRestaurants, activeRestaurants, totalPlays, totalWins, totalOptins };
}
