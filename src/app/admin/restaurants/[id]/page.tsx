import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getRestaurantStats } from "@/lib/stats";
import { logoUrlFor } from "@/lib/logo";
import StatCard from "@/components/admin/StatCard";
import PlaysTable from "@/components/admin/PlaysTable";
import PrizeEditor from "@/components/admin/PrizeEditor";
import RestaurantSettingsForm from "@/components/admin/RestaurantSettingsForm";
import AddAdminForm from "@/components/admin/AddAdminForm";
import ActiveToggle from "@/components/admin/ActiveToggle";
import QrCodeCard from "@/components/admin/QrCodeCard";
import LogoUploadForm from "@/components/admin/LogoUploadForm";

export default async function RestaurantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
    include: { users: { orderBy: { createdAt: "asc" } } },
  });
  if (!restaurant) notFound();

  const stats = await getRestaurantStats(id);
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const wheelUrl = `${appUrl}/r/${restaurant.slug}`;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">{restaurant.name}</h1>
          <a href={wheelUrl} target="_blank" rel="noopener" className="text-sm font-semibold text-purple hover:underline">
            {wheelUrl}
          </a>
        </div>
        <div className="flex items-center gap-2">
          <ActiveToggle restaurantId={restaurant.id} active={restaurant.active} />
          <a
            href={`/api/export/${restaurant.id}`}
            className="rounded-xl border border-black/10 px-4 py-2.5 text-sm font-extrabold text-ink-soft transition hover:border-black/20 hover:text-ink"
          >
            Exporter les emails (CSV)
          </a>
        </div>
      </div>

      <QrCodeCard url={wheelUrl} filename={`qr-${restaurant.slug}.png`} />

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
        <h2 className="text-lg font-extrabold text-ink">Logo</h2>
        <div className="rounded-2xl border border-black/[0.06] bg-white p-5">
          <LogoUploadForm restaurantId={restaurant.id} logoUrl={logoUrlFor(restaurant)} />
        </div>
      </section>

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
          <PrizeEditor restaurantId={restaurant.id} initialPrizes={stats.prizes} />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-extrabold text-ink">Comptes administrateurs</h2>
        <div className="flex flex-col gap-3 rounded-2xl border border-black/[0.06] bg-white p-5">
          <ul className="flex flex-col gap-1.5">
            {restaurant.users.map((u) => (
              <li key={u.id} className="text-sm font-semibold text-ink-soft">
                {u.name} — <span className="text-ink-mute">{u.email}</span>
              </li>
            ))}
          </ul>
          <div className="mt-2 border-t border-black/[0.06] pt-4">
            <AddAdminForm restaurantId={restaurant.id} />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-extrabold text-ink">Participations</h2>
        <PlaysTable plays={stats.recentPlays} editable />
      </section>
    </div>
  );
}
