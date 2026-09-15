"use client";

import { useEffect, useRef, useState, useTransition, type CSSProperties } from "react";
import Image from "next/image";
import { spinAction, submitEmailAction } from "@/actions/game";
import { getSegmentStyle } from "@/lib/wheel-visuals";

export type PrizeDTO = { position: number; label: string; emoji: string; isWin: boolean };

export type WheelAppProps = {
  restaurantSlug: string;
  restaurantName: string;
  reviewUrl: string;
  unlockDelay: number;
  confettiEnabled: boolean;
  prizes: PrizeDTO[];
};

type Screen = "welcome" | "review" | "wheel" | "win" | "code" | "lose";

const CONFETTI_COLORS = ["#E8A33D", "#5B4AEE", "#F2C48A", "#9D87FF"];

// Spin animation: a constant-speed "rev" while we wait on the server for the
// actual result, then a physics-based settle (slight overshoot past the
// prize, then back onto it) once we know where to land.
const REV_SPEED_DEG_PER_MS = 0.9;
const LAND_DUR_MS = 3400;
const LAND_OVERSHOOT_DEG = 27;
const LAND_BREAK = 0.84;

function easeOutQuart(t: number) {
  return 1 - Math.pow(1 - t, 4);
}
function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

export default function WheelApp({
  restaurantSlug,
  restaurantName,
  reviewUrl,
  unlockDelay,
  confettiEnabled,
  prizes,
}: WheelAppProps) {
  const [screen, setScreen] = useState<Screen>("welcome");
  const [opened, setOpened] = useState(false);
  const [left, setLeft] = useState(unlockDelay);
  const [spinning, setSpinning] = useState(false);
  const [playId, setPlayId] = useState<string | null>(null);
  const [prizeLabel, setPrizeLabel] = useState("");
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState("");
  const [optin, setOptin] = useState(true);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const wheelRef = useRef<HTMLDivElement | null>(null);
  const rimRef = useRef<HTMLDivElement | null>(null);
  const confettiRef = useRef<HTMLDivElement | null>(null);
  const rotationRef = useRef(0);
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (tickerRef.current) clearInterval(tickerRef.current);
    };
  }, []);

  function onReviewClick() {
    if (opened) return;
    setOpened(true);
    setLeft(unlockDelay);
    if (tickerRef.current) clearInterval(tickerRef.current);
    tickerRef.current = setInterval(() => {
      setLeft((s) => {
        if (s <= 1) {
          if (tickerRef.current) clearInterval(tickerRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  function burstConfetti() {
    if (!confettiEnabled) return;
    const el = confettiRef.current;
    if (!el) return;
    el.innerHTML = "";
    for (let i = 0; i < 46; i++) {
      const d = document.createElement("div");
      const w = 5 + Math.random() * 7;
      d.style.cssText =
        "position:absolute;top:-6%;left:" +
        (Math.random() * 100).toFixed(2) +
        "%;width:" +
        w.toFixed(1) +
        "px;height:" +
        (w * 0.42).toFixed(1) +
        "px;border-radius:1px;background:" +
        CONFETTI_COLORS[i % 4] +
        ";opacity:0;animation:rvfall " +
        (2.3 + Math.random() * 1.9).toFixed(2) +
        "s cubic-bezier(.25,.6,.4,1) " +
        (Math.random() * 0.7).toFixed(2) +
        "s forwards;";
      el.appendChild(d);
    }
  }

  function handleSpin() {
    if (spinning || isPending) return;
    setError(null);
    setSpinning(true);
    rotationRef.current = 0;
    if (wheelRef.current) wheelRef.current.style.transform = "";
    if (rimRef.current) rimRef.current.style.animation = "none";

    let phase: "revving" | "landing" | "done" = "revving";
    let revStart: number | null = null;
    let landStart: number | null = null;
    let landFrom = 0;
    let landTargetDelta = 0;
    let rafId = 0;

    const applyRotation = (deg: number) => {
      rotationRef.current = deg;
      if (wheelRef.current) wheelRef.current.style.transform = `rotate(${deg}deg)`;
    };

    const step = (now: number) => {
      if (phase === "revving") {
        if (revStart === null) revStart = now;
        applyRotation((now - revStart) * REV_SPEED_DEG_PER_MS);
        rafId = requestAnimationFrame(step);
        return;
      }
      if (phase === "landing") {
        if (landStart === null) landStart = now;
        const t = Math.min(1, (now - landStart) / LAND_DUR_MS);
        let traveled: number;
        if (t < LAND_BREAK) {
          traveled = (landTargetDelta + LAND_OVERSHOOT_DEG) * easeOutQuart(t / LAND_BREAK);
        } else {
          traveled =
            landTargetDelta +
            LAND_OVERSHOOT_DEG -
            LAND_OVERSHOOT_DEG * easeOutCubic((t - LAND_BREAK) / (1 - LAND_BREAK));
        }
        applyRotation(landFrom + traveled);
        if (t < 1) {
          rafId = requestAnimationFrame(step);
        } else {
          phase = "done";
        }
        return;
      }
    };
    rafId = requestAnimationFrame(step);

    startTransition(async () => {
      const result = await spinAction(restaurantSlug);
      if (!result.ok) {
        cancelAnimationFrame(rafId);
        setSpinning(false);
        setError(result.error);
        return;
      }

      const requiredAngle = 360 - (result.position * 45 + 22.5);
      const currentMod = ((rotationRef.current % 360) + 360) % 360;
      const deltaToTarget = ((requiredAngle - currentMod) % 360 + 360) % 360;
      landFrom = rotationRef.current;
      landTargetDelta = 720 + deltaToTarget;
      phase = "landing";

      // Wait for the landing animation to finish, then reveal the result.
      const totalWaitMs = LAND_DUR_MS + 50;
      setTimeout(() => {
        setSpinning(false);
        setPlayId(result.playId);
        setPrizeLabel(result.prizeLabel);
        setCode(result.code);
        setCopied(false);
        if (result.won) {
          setScreen("win");
          setTimeout(burstConfetti, 60);
        } else {
          setScreen("lose");
        }
      }, totalWaitMs);
    });
  }

  function handleSubmitEmail() {
    if (!playId) return;
    setError(null);
    startTransition(async () => {
      const result = await submitEmailAction(playId, email, optin);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSent(true);
      setScreen("code");
    });
  }

  function handleCopyCode() {
    if (!code) return;
    try {
      navigator.clipboard.writeText(code);
    } catch {
      // clipboard unavailable — no-op, the code is still visible on screen
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }

  const emailInvalid = !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email.trim());
  const waiting = opened && left > 0;
  const canPlay = opened && left === 0;

  return (
    <div style={s.page}>
      <div style={s.blobTop} />
      <div style={s.blobBottom} />

      <div style={s.header}>
        <div style={s.logoBox}>
          LOGO
          <br />
          RESTO
        </div>
        <div style={{ minWidth: 0, flex: "1 1 auto" }}>
          <div style={s.restaurantName}>{restaurantName}</div>
          <div style={s.restaurantSub}>Jeu offert par la maison</div>
        </div>
      </div>

      {screen === "welcome" && (
        <WelcomeScreen onStart={() => setScreen("review")} />
      )}

      {screen === "review" && (
        <ReviewScreen
          reviewUrl={reviewUrl}
          onReviewClick={onReviewClick}
          waiting={waiting}
          canPlay={canPlay}
          left={left}
          onPlay={() => setScreen("wheel")}
        />
      )}

      {screen === "wheel" && (
        <WheelScreen
          prizes={prizes}
          spinning={spinning}
          onSpin={handleSpin}
          wheelRef={wheelRef}
          rimRef={rimRef}
          error={error}
        />
      )}

      {screen === "win" && (
        <WinScreen
          confettiRef={confettiRef}
          prizeLabel={prizeLabel}
          restaurantName={restaurantName}
          email={email}
          setEmail={setEmail}
          optin={optin}
          setOptin={setOptin}
          emailInvalid={emailInvalid}
          onSubmit={handleSubmitEmail}
          onSkip={() => setScreen("code")}
          error={error}
          isPending={isPending}
        />
      )}

      {screen === "code" && (
        <CodeScreen
          prizeLabel={prizeLabel}
          sent={sent}
          email={email}
          code={code}
          copied={copied}
          onCopy={handleCopyCode}
        />
      )}

      {screen === "lose" && <LoseScreen />}

      <div style={s.footer}>
        <span style={s.footerText}>Propulsé par</span>
        <Image src="/assets/revally-icon.png" alt="Revally" width={16} height={16} style={{ borderRadius: 5, display: "block" }} />
        <span style={s.footerBrand}>Revally</span>
      </div>
    </div>
  );
}

/* ---------------------------------- screens ---------------------------------- */

function WelcomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <div style={{ ...s.screen, justifyContent: "center", padding: "10px 0 0", animation: "rvrise .45s ease both" }}>
      <div style={s.badgePurple}>
        <span style={s.badgeEmoji}>👋</span> Merci de votre visite
      </div>
      <h1 style={s.h1}>
        Faites tourner
        <br />
        la roue,
        <br />
        <span style={{ color: "#5B4AEE" }}>gagnez un lot.</span>
      </h1>
      <p style={s.pIntro}>
        Un avis, un tour de roue, et vous repartez peut-être avec un café, un dessert ou -10%. Une case sur deux est
        gagnante.
      </p>

      <div style={s.stepsCard}>
        <StepRow n={1} text="Vous laissez un avis sur Google" emoji="⭐" />
        <div style={s.divider} />
        <StepRow n={2} text="Vous faites tourner la roue" emoji="🎡" />
        <div style={s.divider} />
        <StepRow n={3} text={"Montre le code reçu à notre équipe et empochez votre lot !"} emoji="🎁" />
      </div>

      <button type="button" onClick={onStart} style={s.primaryButton} className="rv-btn-primary">
        C&apos;est parti
      </button>
      <p style={s.footNote}>
        Sans obligation d&apos;achat · 1 participation par visite ·{" "}
        <a href="#reglement" style={{ color: "#5B4AEE" }}>
          Règlement du jeu
        </a>
      </p>
    </div>
  );
}

function StepRow({ n, text, emoji }: { n: number; text: string; emoji: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 13, padding: "14px 12px" }}>
      <span style={s.stepNum}>{n}</span>
      <span style={s.stepText}>{text}</span>
      <span style={{ marginLeft: "auto", fontSize: 19, lineHeight: 1 }}>{emoji}</span>
    </div>
  );
}

function ProgressBar({ filled }: { filled: 1 | 2 }) {
  return (
    <div style={{ display: "flex", gap: 6, margin: "0 0 24px" }}>
      <span style={s.progressSeg(true)} />
      <span style={s.progressSeg(filled === 2)} />
    </div>
  );
}

function ReviewScreen({
  reviewUrl,
  onReviewClick,
  waiting,
  canPlay,
  left,
  onPlay,
}: {
  reviewUrl: string;
  onReviewClick: () => void;
  waiting: boolean;
  canPlay: boolean;
  left: number;
  onPlay: () => void;
}) {
  return (
    <div style={{ ...s.screen, justifyContent: "center", padding: "10px 0 0", animation: "rvrise .45s ease both" }}>
      <ProgressBar filled={1} />
      <h2 style={s.h2}>
        Votre avis, puis
        <br />
        la roue.
      </h2>
      <p style={s.pBody}>
        Deux lignes suffisent — c&apos;est ce qui aide vraiment l&apos;équipe. Revenez ensuite ici pour jouer.
      </p>

      <div style={s.reviewCard}>
        <div style={s.reviewCardLabel}>Votre note</div>
        <div style={s.stars}>★★★★★</div>
        <div style={s.reviewCardHint}>Vous serez redirigé vers la fiche Google de l&apos;établissement.</div>
      </div>

      <a href={reviewUrl} target="_blank" rel="noopener" onClick={onReviewClick} style={s.primaryLink} className="rv-btn-primary">
        Laisser mon avis
      </a>

      {waiting && (
        <div style={s.waitingRow}>
          <span style={s.waitingDot} />
          <span style={s.waitingLabel}>Votre roue se débloque dans {left} s</span>
        </div>
      )}

      {canPlay && (
        <button type="button" onClick={onPlay} style={s.goldButton} className="rv-btn-gold">
          Accéder à la roue →
        </button>
      )}

      <p style={s.footNote}>Le lot est offert quel que soit le contenu de votre avis.</p>
    </div>
  );
}

function WheelScreen({
  prizes,
  spinning,
  onSpin,
  wheelRef,
  rimRef,
  error,
}: {
  prizes: PrizeDTO[];
  spinning: boolean;
  onSpin: () => void;
  wheelRef: React.RefObject<HTMLDivElement | null>;
  rimRef: React.RefObject<HTMLDivElement | null>;
  error: string | null;
}) {
  const gradientStops = prizes
    .map((p) => {
      const style = getSegmentStyle(p.position);
      const from = p.position * 45;
      return `${style.bg} ${from}deg ${from + 45}deg`;
    })
    .join(",");

  return (
    <div style={{ ...s.screen, justifyContent: "center", padding: "6px 0 0", animation: "rvrise .45s ease both" }}>
      <ProgressBar filled={2} />
      <h2 style={{ ...s.h2, textAlign: "center" }}>À vous de jouer</h2>
      <p style={s.wheelSub}>4 cases gagnantes sur 8</p>

      <div style={s.wheelWrap}>
        <div style={s.pointer} />

        <div ref={rimRef} style={s.rim}>
          <div ref={wheelRef} style={{ ...s.wheel, background: `conic-gradient(from 0deg,${gradientStops})` }}>
            {prizes.map((p) => {
              const style = getSegmentStyle(p.position);
              const mid = p.position * 45 + 22.5;
              return (
                <div key={p.position} style={{ position: "absolute", inset: 0, transform: `rotate(${mid}deg)` }}>
                  <div
                    style={{
                      position: "absolute",
                      top: 26,
                      left: "50%",
                      width: 88,
                      marginLeft: -44,
                      textAlign: "center",
                      transform: `rotate(${-mid}deg)`,
                      font: `${style.fontWeight} ${style.fontSize}px/1.18 'Plus Jakarta Sans',sans-serif`,
                      letterSpacing: style.fontWeight >= 800 ? "-.02em" : "-.015em",
                      color: style.color,
                    }}
                  >
                    <span style={{ display: "block", fontSize: 17, lineHeight: 1.15 }}>{p.emoji}</span>
                    {p.label}
                  </div>
                </div>
              );
            })}

            <div style={s.wheelTicks} />
            <div style={s.wheelSheen} />
          </div>
        </div>

        <div style={s.pingRing} />
        <button
          type="button"
          onClick={onSpin}
          disabled={spinning}
          aria-label="Tourner la roue"
          style={s.centerButton}
          className="rv-btn-center"
        >
          <span style={{ font: "400 20px/1 'Plus Jakarta Sans',sans-serif", color: "#FFD98A" }}>★</span>
          <span style={{ font: "800 10px/1 'Plus Jakarta Sans',sans-serif", color: "#FFFFFF", letterSpacing: ".07em" }}>
            TOURNER
          </span>
        </button>
      </div>

      <button type="button" onClick={onSpin} disabled={spinning} style={s.primaryButton} className="rv-btn-primary">
        {spinning ? "La roue tourne…" : "Tourner la roue"}
      </button>
      {error && <p style={s.errorText}>{error}</p>}
      <p style={s.footNote}>Touchez la roue ou le bouton · 1 seul essai</p>
    </div>
  );
}

function WinScreen({
  confettiRef,
  prizeLabel,
  restaurantName,
  email,
  setEmail,
  optin,
  setOptin,
  emailInvalid,
  onSubmit,
  onSkip,
  error,
  isPending,
}: {
  confettiRef: React.RefObject<HTMLDivElement | null>;
  prizeLabel: string;
  restaurantName: string;
  email: string;
  setEmail: (v: string) => void;
  optin: boolean;
  setOptin: (v: boolean) => void;
  emailInvalid: boolean;
  onSubmit: () => void;
  onSkip: () => void;
  error: string | null;
  isPending: boolean;
}) {
  return (
    <div style={{ ...s.screen, justifyContent: "center", padding: "10px 0 0", animation: "rvrise .5s ease both" }}>
      <div ref={confettiRef} style={s.confettiBox} />

      <div style={{ position: "relative", zIndex: 3 }}>
        <div style={s.badgeGold}>
          <span style={s.badgeEmoji}>🎉</span> C&apos;est gagné
        </div>
        <h2 style={{ ...s.h2Big }}>Vous repartez avec</h2>
        <p style={s.prizeLabel}>{prizeLabel}</p>
        <p style={s.pBody}>Où envoyons-nous votre code ? Vous le recevez tout de suite par email — impossible de le perdre.</p>

        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="prenom@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={s.emailInput}
          className="rv-input"
        />

        <label style={s.optinRow}>
          <input
            type="checkbox"
            checked={optin}
            onChange={(e) => setOptin(e.target.checked)}
            style={s.checkbox}
          />
          <span style={s.optinText}>Je souhaite recevoir les offres et nouveautés de {restaurantName}.</span>
        </label>

        <button
          type="button"
          onClick={onSubmit}
          disabled={emailInvalid || isPending}
          style={s.primaryButton}
          className="rv-btn-primary"
        >
          Recevoir mon code
        </button>
        {error && <p style={s.errorText}>{error}</p>}
        <button type="button" onClick={onSkip} style={s.linkButton} className="rv-link-muted">
          Je préfère juste l&apos;afficher
        </button>
      </div>
    </div>
  );
}

function CodeScreen({
  prizeLabel,
  sent,
  email,
  code,
  copied,
  onCopy,
}: {
  prizeLabel: string;
  sent: boolean;
  email: string;
  code: string | null;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div style={{ ...s.screen, justifyContent: "center", padding: "10px 0 0", animation: "rvrise .45s ease both" }}>
      <div style={{ ...s.badgeGold, alignSelf: "flex-start", display: "inline-block" }}>{prizeLabel}</div>
      <h2 style={s.h2Big}>Votre code est prêt.</h2>

      {sent && (
        <div style={s.sentRow}>
          <span style={s.sentDot} />
          <span style={s.sentLabel}>Envoyé à {email}</span>
        </div>
      )}

      <div style={s.codeCard}>
        <div style={s.codeCardLabel}>
          <span style={s.badgeEmoji}>🎟️</span> Code unique
        </div>
        <div style={s.codeValue}>{code ?? "—"}</div>
        <div style={s.codeHint}>Valable 30 jours · usage unique</div>
      </div>

      <button type="button" onClick={onCopy} style={s.primaryButton} className="rv-btn-primary">
        {copied ? "Code copié ✓" : "Copier le code"}
      </button>
      <p style={{ ...s.footNote, color: "#4E4A6B" }}>Annoncez ce code à l&apos;équipe lors de votre prochaine commande.</p>
    </div>
  );
}

function LoseScreen() {
  return (
    <div style={{ ...s.screen, justifyContent: "center", padding: "10px 0 0", animation: "rvrise .5s ease both" }}>
      <div style={s.badgeNeutral}>
        <span style={s.badgeEmoji}>🤞</span> Dommage
      </div>
      <h2 style={s.h2Big}>
        Pas de lot
        <br />
        cette fois-ci.
      </h2>
      <p style={s.pBody}>
        Merci sincèrement pour votre avis — c&apos;est ce qui compte le plus pour l&apos;équipe. La roue vous attend à
        votre prochaine visite.
      </p>

      <div style={s.nextTryCard}>
        <div style={s.reviewCardLabel}>Prochain essai</div>
        <div style={s.nextTryValue}>À votre prochaine visite</div>
      </div>

      <a href="#carte" style={s.outlineLink} className="rv-link-outline">
        Voir la carte du restaurant
      </a>
    </div>
  );
}

/* ---------------------------------- styles ---------------------------------- */

const s = {
  page: {
    position: "relative",
    width: "100%",
    maxWidth: 440,
    minHeight: "100dvh",
    margin: "0 auto",
    background: "#F0EEFF",
    color: "#1A1730",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    padding: "0 20px 26px",
  } as CSSProperties,
  blobTop: {
    position: "absolute",
    top: -240,
    left: "50%",
    width: 620,
    height: 620,
    marginLeft: -310,
    borderRadius: "50%",
    background: "radial-gradient(circle,rgba(125,98,254,.26),rgba(125,98,254,0) 66%)",
    pointerEvents: "none",
  } as CSSProperties,
  blobBottom: {
    position: "absolute",
    bottom: -170,
    left: -150,
    width: 420,
    height: 420,
    borderRadius: "50%",
    background: "radial-gradient(circle,rgba(232,163,61,.26),rgba(232,163,61,0) 68%)",
    pointerEvents: "none",
  } as CSSProperties,
  header: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "20px 0 6px",
  } as CSSProperties,
  logoBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    flex: "0 0 auto",
    background: "repeating-linear-gradient(135deg,rgba(26,23,48,.10) 0 4px,rgba(26,23,48,.03) 4px 8px)",
    border: "1px solid rgba(26,23,48,.14)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    font: "500 6px/1.3 'DM Mono',monospace",
    color: "#5B5878",
    textAlign: "center",
    letterSpacing: ".02em",
  } as CSSProperties,
  restaurantName: {
    font: "800 17px/1.2 'Plus Jakarta Sans',sans-serif",
    letterSpacing: "-.02em",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    color: "#1A1730",
  } as CSSProperties,
  restaurantSub: {
    font: "500 11.5px/1.35 'Plus Jakarta Sans',sans-serif",
    color: "#5B5878",
  } as CSSProperties,
  screen: {
    position: "relative",
    flex: "1 1 auto",
    display: "flex",
    flexDirection: "column",
  } as CSSProperties,
  badgePurple: {
    alignSelf: "flex-start",
    padding: "7px 13px",
    borderRadius: 999,
    background: "rgba(91,74,238,.1)",
    border: "1px solid rgba(91,74,238,.28)",
    font: "700 11px/1 'Plus Jakarta Sans',sans-serif",
    color: "#5B4AEE",
    letterSpacing: ".08em",
    textTransform: "uppercase",
  } as CSSProperties,
  badgeGold: {
    padding: "7px 14px",
    borderRadius: 999,
    background: "#E8A33D",
    border: "1px solid #CE8D26",
    font: "700 11px/1 'Plus Jakarta Sans',sans-serif",
    color: "#2B1A00",
    letterSpacing: ".1em",
    textTransform: "uppercase",
  } as CSSProperties,
  badgeNeutral: {
    display: "inline-block",
    alignSelf: "flex-start",
    padding: "7px 14px",
    borderRadius: 999,
    background: "rgba(26,23,48,.06)",
    border: "1px solid rgba(26,23,48,.14)",
    font: "700 11px/1 'Plus Jakarta Sans',sans-serif",
    color: "#4E4A6B",
    letterSpacing: ".1em",
    textTransform: "uppercase",
  } as CSSProperties,
  badgeEmoji: { fontSize: 15, letterSpacing: "normal", lineHeight: 1, verticalAlign: -1 } as CSSProperties,
  h1: {
    margin: "18px 0 0",
    font: "800 38px/1.02 'Plus Jakarta Sans',sans-serif",
    letterSpacing: "-.04em",
    color: "#1A1730",
  } as CSSProperties,
  h2: {
    margin: 0,
    font: "800 32px/1.06 'Plus Jakarta Sans',sans-serif",
    letterSpacing: "-.036em",
    color: "#1A1730",
  } as CSSProperties,
  h2Big: {
    margin: "16px 0 0",
    font: "800 33px/1.04 'Plus Jakarta Sans',sans-serif",
    letterSpacing: "-.04em",
    color: "#1A1730",
  } as CSSProperties,
  pIntro: {
    margin: "15px 0 0",
    maxWidth: "33ch",
    font: "500 15px/1.55 'Plus Jakarta Sans',sans-serif",
    color: "#4E4A6B",
  } as CSSProperties,
  pBody: {
    margin: "13px 0 0",
    maxWidth: "32ch",
    font: "500 15px/1.55 'Plus Jakarta Sans',sans-serif",
    color: "#4E4A6B",
  } as CSSProperties,
  stepsCard: {
    display: "flex",
    flexDirection: "column",
    margin: "28px 0 0",
    borderRadius: 20,
    background: "#FFFFFF",
    border: "1px solid rgba(26,23,48,.09)",
    boxShadow: "0 4px 16px rgba(26,23,48,.05)",
    padding: 6,
  } as CSSProperties,
  divider: { height: 1, background: "rgba(26,23,48,.08)", margin: "0 12px" } as CSSProperties,
  stepNum: {
    width: 28,
    height: 28,
    flex: "0 0 auto",
    borderRadius: 10,
    background: "rgba(91,74,238,.12)",
    border: "1px solid rgba(91,74,238,.32)",
    color: "#5B4AEE",
    font: "800 12px/28px 'Plus Jakarta Sans',sans-serif",
    textAlign: "center",
  } as CSSProperties,
  stepText: { font: "600 14.5px/1.35 'Plus Jakarta Sans',sans-serif", color: "#2B2748" } as CSSProperties,
  primaryButton: {
    margin: "26px 0 0",
    width: "100%",
    minHeight: 58,
    border: 0,
    borderRadius: 16,
    background: "#5B4AEE",
    color: "#FFFFFF",
    font: "800 16.5px/1 'Plus Jakarta Sans',sans-serif",
    letterSpacing: "-.01em",
    cursor: "pointer",
    boxShadow: "0 16px 34px -16px rgba(91,74,238,.85)",
  } as CSSProperties,
  primaryLink: {
    margin: "22px 0 0",
    width: "100%",
    minHeight: 58,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    background: "#5B4AEE",
    color: "#FFFFFF",
    font: "800 16.5px/1 'Plus Jakarta Sans',sans-serif",
    letterSpacing: "-.01em",
    boxShadow: "0 16px 34px -16px rgba(91,74,238,.85)",
  } as CSSProperties,
  goldButton: {
    margin: "14px 0 0",
    width: "100%",
    minHeight: 56,
    border: "1px solid #CE8D26",
    borderRadius: 16,
    background: "#E8A33D",
    color: "#2B1A00",
    font: "800 15.5px/1 'Plus Jakarta Sans',sans-serif",
    cursor: "pointer",
    animation: "rvpop .4s ease both",
  } as CSSProperties,
  footNote: {
    margin: "14px 0 0",
    font: "500 11.5px/1.5 'Plus Jakarta Sans',sans-serif",
    color: "#5B5878",
    textAlign: "center",
  } as CSSProperties,
  errorText: {
    margin: "10px 0 0",
    font: "600 12.5px/1.5 'Plus Jakarta Sans',sans-serif",
    color: "#C23B3B",
    textAlign: "center",
  } as CSSProperties,
  progressSeg: (filled: boolean): CSSProperties => ({
    height: 3,
    flex: 1,
    borderRadius: 2,
    background: filled ? "#5B4AEE" : "rgba(26,23,48,.13)",
  }),
  reviewCard: {
    margin: "26px 0 0",
    padding: "24px 20px",
    borderRadius: 22,
    background: "#FFFFFF",
    border: "1px solid rgba(91,74,238,.2)",
    boxShadow: "0 4px 16px rgba(26,23,48,.05)",
    textAlign: "center",
  } as CSSProperties,
  reviewCardLabel: {
    font: "700 10.5px/1 'Plus Jakarta Sans',sans-serif",
    color: "#5B5878",
    letterSpacing: ".1em",
    textTransform: "uppercase",
  } as CSSProperties,
  stars: { margin: "14px 0 0", font: "400 36px/1 'Plus Jakarta Sans',sans-serif", color: "#B8790F", letterSpacing: ".12em" } as CSSProperties,
  reviewCardHint: { margin: "14px 0 0", font: "500 13.5px/1.5 'Plus Jakarta Sans',sans-serif", color: "#4E4A6B" } as CSSProperties,
  waitingRow: { margin: "14px 0 0", display: "flex", alignItems: "center", justifyContent: "center", gap: 9, minHeight: 52 } as CSSProperties,
  waitingDot: { width: 7, height: 7, borderRadius: "50%", background: "#5B4AEE", display: "block" } as CSSProperties,
  waitingLabel: { font: "600 13px/1.4 'Plus Jakarta Sans',sans-serif", color: "#4E4A6B" } as CSSProperties,
  wheelSub: { margin: "9px 0 0", font: "600 13.5px/1.5 'Plus Jakarta Sans',sans-serif", color: "#5B4AEE", textAlign: "center", letterSpacing: ".01em" } as CSSProperties,
  wheelWrap: { position: "relative", width: "min(82vw,336px)", aspectRatio: "1", margin: "16px auto 0" } as CSSProperties,
  pointer: {
    position: "absolute",
    top: -4,
    left: "50%",
    marginLeft: -13,
    zIndex: 6,
    width: 0,
    height: 0,
    borderLeft: "13px solid transparent",
    borderRight: "13px solid transparent",
    borderTop: "22px solid #1A1730",
    filter: "drop-shadow(0 3px 5px rgba(26,23,48,.35))",
  } as CSSProperties,
  rim: {
    position: "absolute",
    inset: 0,
    borderRadius: "50%",
    padding: 9,
    background: "linear-gradient(160deg,#9D87FF,#5B4AEE 46%,#B6ADFF 72%,#4A3BD0)",
    boxShadow: "0 26px 54px -20px rgba(91,74,238,.65),0 0 0 1px rgba(26,23,48,.06)",
    animation: "rvrock 6.5s ease-in-out infinite",
  } as CSSProperties,
  wheel: {
    position: "relative",
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    overflow: "hidden",
    willChange: "transform",
  } as CSSProperties,
  wheelTicks: {
    position: "absolute",
    inset: 0,
    borderRadius: "50%",
    background: "repeating-conic-gradient(from -0.4deg,rgba(17,15,31,.16) 0deg .9deg,rgba(17,15,31,0) .9deg 45deg)",
    pointerEvents: "none",
  } as CSSProperties,
  wheelSheen: {
    position: "absolute",
    inset: 0,
    borderRadius: "50%",
    background: "radial-gradient(circle at 50% 16%,rgba(255,255,255,.18),rgba(255,255,255,0) 48%)",
    pointerEvents: "none",
  } as CSSProperties,
  pingRing: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 92,
    height: 92,
    margin: "-46px 0 0 -46px",
    zIndex: 4,
    borderRadius: "50%",
    border: "2px solid #5B4AEE",
    animation: "rvping 2.6s ease-out infinite",
    pointerEvents: "none",
  } as CSSProperties,
  centerButton: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 92,
    height: 92,
    margin: "-46px 0 0 -46px",
    zIndex: 5,
    border: 0,
    borderRadius: "50%",
    background: "#5B4AEE",
    boxShadow: "0 10px 26px rgba(26,23,48,.32),inset 0 0 0 4px #FFFFFF",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    cursor: "pointer",
  } as CSSProperties,
  confettiBox: { position: "absolute", inset: "-40px -20px", overflow: "hidden", pointerEvents: "none", zIndex: 2 } as CSSProperties,
  prizeLabel: {
    margin: "8px 0 0",
    font: "800 28px/1.14 'Plus Jakarta Sans',sans-serif",
    letterSpacing: "-.035em",
    color: "#5B4AEE",
    animation: "rvpop .5s .15s ease both",
  } as CSSProperties,
  emailInput: {
    margin: "20px 0 0",
    width: "100%",
    minHeight: 56,
    padding: "0 18px",
    borderRadius: 16,
    border: "1px solid rgba(26,23,48,.16)",
    background: "#FFFFFF",
    color: "#1A1730",
    font: "600 16px/1 'Plus Jakarta Sans',sans-serif",
    outline: "none",
  } as CSSProperties,
  optinRow: { margin: "14px 0 0", display: "flex", alignItems: "flex-start", gap: 11, cursor: "pointer" } as CSSProperties,
  checkbox: { width: 20, height: 20, marginTop: 1, flex: "0 0 auto", accentColor: "#5B4AEE" } as CSSProperties,
  optinText: { font: "500 12.5px/1.45 'Plus Jakarta Sans',sans-serif", color: "#4E4A6B" } as CSSProperties,
  linkButton: {
    margin: "8px 0 0",
    width: "100%",
    minHeight: 44,
    border: 0,
    background: "transparent",
    color: "#5B5878",
    font: "600 12.5px/1 'Plus Jakarta Sans',sans-serif",
    cursor: "pointer",
    textDecoration: "underline",
  } as CSSProperties,
  sentRow: {
    margin: "14px 0 0",
    display: "flex",
    alignItems: "center",
    gap: 9,
    padding: "13px 15px",
    borderRadius: 14,
    background: "rgba(91,74,238,.1)",
    border: "1px solid rgba(91,74,238,.26)",
  } as CSSProperties,
  sentDot: { width: 6, height: 6, borderRadius: "50%", background: "#5B4AEE", flex: "0 0 auto" } as CSSProperties,
  sentLabel: {
    font: "600 12.5px/1.4 'Plus Jakarta Sans',sans-serif",
    color: "#3D3563",
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
  } as CSSProperties,
  codeCard: {
    margin: "22px 0 0",
    padding: "26px 20px",
    borderRadius: 22,
    background: "#FFFFFF",
    border: "1.5px dashed rgba(232,163,61,.75)",
    boxShadow: "0 4px 16px rgba(26,23,48,.05)",
    textAlign: "center",
  } as CSSProperties,
  codeCardLabel: {
    font: "700 10.5px/1 'Plus Jakarta Sans',sans-serif",
    color: "#5B5878",
    letterSpacing: ".11em",
    textTransform: "uppercase",
  } as CSSProperties,
  codeValue: { margin: "14px 0 0", font: "500 34px/1 'DM Mono',monospace", color: "#1A1730", letterSpacing: ".14em" } as CSSProperties,
  codeHint: { margin: "14px 0 0", font: "500 12.5px/1.5 'Plus Jakarta Sans',sans-serif", color: "#5B5878" } as CSSProperties,
  nextTryCard: {
    margin: "28px 0 0",
    padding: 20,
    borderRadius: 22,
    background: "#FFFFFF",
    border: "1px solid rgba(26,23,48,.09)",
    boxShadow: "0 4px 16px rgba(26,23,48,.05)",
  } as CSSProperties,
  nextTryValue: { margin: "11px 0 0", font: "800 21px/1.2 'Plus Jakarta Sans',sans-serif", letterSpacing: "-.025em", color: "#1A1730" } as CSSProperties,
  outlineLink: {
    margin: "24px 0 0",
    width: "100%",
    minHeight: 58,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    border: "1px solid rgba(26,23,48,.18)",
    background: "transparent",
    color: "#2B2748",
    font: "700 15px/1 'Plus Jakarta Sans',sans-serif",
  } as CSSProperties,
  footer: { position: "relative", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "26px 0 4px" } as CSSProperties,
  footerText: { font: "500 11px/1 'Plus Jakarta Sans',sans-serif", color: "#6B6788" } as CSSProperties,
  footerBrand: { font: "800 12.5px/1 'Plus Jakarta Sans',sans-serif", color: "#4E4A6B", letterSpacing: "-.01em" } as CSSProperties,
};
