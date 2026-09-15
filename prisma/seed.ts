import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

const prisma = new PrismaClient();

const DEFAULT_PRIZES = [
  { position: 0, label: "1 café offert", emoji: "☕", isWin: true, weight: 8 },
  { position: 1, label: "Rien cette fois", emoji: "🤞", isWin: false, weight: 20 },
  { position: 2, label: "-10% de réduction", emoji: "🏷️", isWin: true, weight: 14 },
  { position: 3, label: "Rien cette fois", emoji: "🤞", isWin: false, weight: 20 },
  { position: 4, label: "1 dessert offert", emoji: "🍰", isWin: true, weight: 8 },
  { position: 5, label: "Rien cette fois", emoji: "🤞", isWin: false, weight: 16 },
  { position: 6, label: "-10% de réduction", emoji: "🏷️", isWin: true, weight: 14 },
  { position: 7, label: "Rien cette fois", emoji: "🤞", isWin: false, weight: 20 },
];

function randomPassword(): string {
  return randomBytes(9).toString("base64url");
}

async function main() {
  const superAdminEmail = (process.env.SEED_SUPER_ADMIN_EMAIL || "admin@revally.fr").toLowerCase();
  let superAdminPassword = process.env.SEED_SUPER_ADMIN_PASSWORD;
  let generatedSuperAdminPassword = false;
  if (!superAdminPassword) {
    superAdminPassword = randomPassword();
    generatedSuperAdminPassword = true;
  }

  const existingSuperAdmin = await prisma.user.findUnique({ where: { email: superAdminEmail } });
  if (!existingSuperAdmin) {
    await prisma.user.create({
      data: {
        email: superAdminEmail,
        name: "Revally",
        role: "SUPER_ADMIN",
        passwordHash: await bcrypt.hash(superAdminPassword, 12),
      },
    });
    console.log("Created super admin:");
    console.log(`  email:    ${superAdminEmail}`);
    if (generatedSuperAdminPassword) {
      console.log(`  password: ${superAdminPassword}  (generated — change it after first login)`);
    } else {
      console.log("  password: (from SEED_SUPER_ADMIN_PASSWORD)");
    }
  } else {
    console.log(`Super admin already exists (${superAdminEmail}), skipping.`);
  }

  const demoSlug = "bella-vista";
  const existingDemo = await prisma.restaurant.findUnique({ where: { slug: demoSlug } });
  if (!existingDemo) {
    const demoAdminEmail = "demo@bellavista.example";
    const demoAdminPassword = process.env.SEED_DEMO_ADMIN_PASSWORD || randomPassword();

    const restaurant = await prisma.restaurant.create({
      data: {
        name: "Bella Vista",
        slug: demoSlug,
        googleReviewUrl: "https://search.google.com/local/writereview",
      },
    });
    await prisma.prize.createMany({
      data: DEFAULT_PRIZES.map((p) => ({ ...p, restaurantId: restaurant.id })),
    });
    await prisma.user.create({
      data: {
        email: demoAdminEmail,
        name: "Bella Vista",
        role: "RESTAURANT_ADMIN",
        restaurantId: restaurant.id,
        passwordHash: await bcrypt.hash(demoAdminPassword, 12),
      },
    });

    console.log("\nCreated demo restaurant 'Bella Vista':");
    console.log(`  wheel:    /r/${demoSlug}`);
    console.log(`  email:    ${demoAdminEmail}`);
    console.log(`  password: ${demoAdminPassword}  (generated — change it after first login)`);
  } else {
    console.log(`Demo restaurant already exists (${demoSlug}), skipping.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
