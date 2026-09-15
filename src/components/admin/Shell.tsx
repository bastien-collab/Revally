import Link from "next/link";
import Image from "next/image";
import { logoutAction } from "@/actions/auth";

export default function Shell({
  eyebrow,
  title,
  name,
  links,
  children,
}: {
  eyebrow: string;
  title: string;
  name: string;
  links: { href: string; label: string }[];
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F7F7FB]">
      <header className="border-b border-black/[0.06] bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <Image src="/assets/revally-icon.png" alt="Revally" width={32} height={32} className="rounded-lg" />
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-ink-mute">{eyebrow}</div>
              <div className="text-[15px] font-extrabold leading-tight text-ink">{title}</div>
            </div>
          </div>

          <nav className="ml-2 flex flex-1 flex-wrap gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-full px-3.5 py-2 text-sm font-semibold text-ink-soft hover:bg-black/[0.04] hover:text-ink"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-semibold text-ink-soft sm:inline">{name}</span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-full border border-black/10 px-3.5 py-2 text-sm font-semibold text-ink-soft transition hover:border-black/20 hover:text-ink"
              >
                Déconnexion
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>
    </div>
  );
}
