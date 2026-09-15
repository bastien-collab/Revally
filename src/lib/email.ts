import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Email sending is stubbed: no provider is wired up yet. We render the
 * message, log it, and persist it to EmailLog so the flow works end-to-end
 * and nothing is lost once a real provider (Resend/SendGrid/etc.) is plugged
 * in here.
 */
export async function sendCodeEmail(params: {
  playId: string;
  to: string;
  restaurantName: string;
  code: string;
  prizeLabel: string;
}): Promise<void> {
  const { playId, to, restaurantName, code, prizeLabel } = params;
  const subject = `Votre code ${restaurantName} : ${code}`;
  const body = [
    `Félicitations, vous avez gagné : ${prizeLabel} !`,
    ``,
    `Votre code unique : ${code}`,
    `Montrez ce code à l'équipe de ${restaurantName} lors de votre prochaine commande.`,
    `Valable 30 jours, usage unique.`,
  ].join("\n");

  console.log(`[EMAIL STUB] To: ${to}\nSubject: ${subject}\n${body}\n`);

  await prisma.emailLog.create({
    data: { playId, to, subject, body },
  });
}
