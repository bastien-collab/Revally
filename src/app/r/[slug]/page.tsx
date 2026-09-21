import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { logoUrlFor } from "@/lib/logo";
import WheelApp from "@/components/wheel/WheelApp";

export default async function WheelPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    include: { prizes: { orderBy: { position: "asc" } } },
  });

  if (!restaurant || !restaurant.active || restaurant.prizes.length === 0) {
    notFound();
  }

  return (
    <div style={{ minHeight: "100dvh", background: "#E6E2FB" }}>
      <WheelApp
        restaurantSlug={restaurant.slug}
        restaurantName={restaurant.name}
        logoUrl={logoUrlFor(restaurant)}
        reviewUrl={restaurant.googleReviewUrl}
        unlockDelay={restaurant.unlockDelay}
        confettiEnabled={restaurant.confettiEnabled}
        prizes={restaurant.prizes.map((p) => ({
          position: p.position,
          label: p.label,
          emoji: p.emoji,
          isWin: p.isWin,
        }))}
      />
    </div>
  );
}
