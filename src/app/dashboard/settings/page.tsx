import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import RestaurantSettingsForm from "@/components/admin/RestaurantSettingsForm";
import PrizeEditor from "@/components/admin/PrizeEditor";

export default async function DashboardSettingsPage() {
  const session = await getSession();
  if (!session?.restaurantId) redirect("/login");

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: session.restaurantId },
    include: { prizes: { orderBy: { position: "asc" } } },
  });
  if (!restaurant) redirect("/login");

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-extrabold tracking-tight text-ink">Paramètres & roue</h1>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-extrabold text-ink">Paramètres</h2>
        <div className="rounded-2xl border border-black/[0.06] bg-white p-5">
          <RestaurantSettingsForm
            restaurantId={restaurant.id}
            initial={{
              name: restaurant.name,
              googleReviewUrl: restaurant.googleReviewUrl,
              unlockDelay: restaurant.unlockDelay,
              confettiEnabled: restaurant.confettiEnabled,
            }}
          />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-extrabold text-ink">La roue</h2>
        <div className="rounded-2xl border border-black/[0.06] bg-white p-5">
          <PrizeEditor restaurantId={restaurant.id} initialPrizes={restaurant.prizes} />
        </div>
      </section>
    </div>
  );
}
