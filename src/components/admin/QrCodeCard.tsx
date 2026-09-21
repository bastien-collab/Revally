import { generateQrDataUrl } from "@/lib/qrcode";

export default async function QrCodeCard({ url, filename }: { url: string; filename: string }) {
  const dataUrl = await generateQrDataUrl(url);

  return (
    <div className="flex flex-wrap items-center gap-5 rounded-2xl border border-black/[0.06] bg-white p-5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={dataUrl} alt="QR code de la roue" className="h-28 w-28 flex-none rounded-xl border border-black/[0.06]" />
      <div className="flex flex-col gap-1.5">
        <div className="text-sm font-extrabold text-ink">QR code à imprimer</div>
        <p className="max-w-sm text-sm font-medium text-ink-soft">
          Pointe vers <span className="font-semibold text-ink">{url}</span>. Affichez-le sur les tables ou au
          comptoir pour que les clients puissent scanner et jouer.
        </p>
        <a
          href={dataUrl}
          download={filename}
          className="mt-1 w-fit rounded-xl bg-purple px-4 py-2 text-sm font-extrabold text-white transition hover:bg-purple-dark"
        >
          Télécharger le QR code
        </a>
      </div>
    </div>
  );
}
