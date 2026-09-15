import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRestaurantStats } from "@/lib/stats";
import StatCard from "@/components/admin/StatCard";
import PlaysTable from "@/components/admin/PlaysTable";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session?.restaurantId) redirect("/login");

  const restaurant = await prisma.restaurant.findUnique({ where: { id: session.restaurantId } });
  if (!restaurant) redirect("/login");

  const stats = await getRestaurantStats(restaurant.id);
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const wheelUrl = `${appUrl}/r/${restaurant.slug}`;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Tableau de bord</h1>
        <p className="mt-1 text-sm font-medium text-ink-soft">
          Votre roue :{" "}
          <a href={wheelUrl} target="_blank" rel="noopener" className="font-semibold text-purple hover:underline">
            {wheelUrl}
          </a>{" "}
          — à afficher en QR code dans votre établissement.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Parties jouées" value={String(stats.totalPlays)} />
        <StatCard
          label="Taux de gain"
          value={stats.totalPlays > 0 ? `${Math.round(stats.winRate * 100)}%` : "—"}
          accent="purple"
        />
        <StatCard label="Lots gagnés" value={String(stats.totalWins)} accent="gold" />
        <StatCard label="Lots récupérés" value={String(stats.totalRedeemed)} hint={`${stats.pendingRedeem} en attente`} />
        <StatCard label="Emails collectés" value={String(stats.optinCount)} />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-extrabold text-ink">Répartition des lots</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {stats.prizes
            .filter((p) => p.isWin)
            .map((p) => (
              <div key={p.id} className="rounded-2xl border border-black/[0.06] bg-white p-4">
                <div className="text-sm font-bold text-ink">
                  {p.emoji} {p.label}
                </div>
                <div className="mt-1 text-xs font-medium text-ink-mute">{p._count.plays} tirage(s)</div>
              </div>
            ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-extrabold text-ink">Participations</h2>
          <a
            href={`/api/export/${restaurant.id}`}
            className="rounded-xl border border-black/10 px-4 py-2 text-sm font-extrabold text-ink-soft transition hover:border-black/20 hover:text-ink"
          >
            Exporter les emails (CSV)
          </a>
        </div>
        <PlaysTable plays={stats.recentPlays} editable />
      </section>
    </div>
  );
}
