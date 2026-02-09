import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Seeds random avgResponseTimeMinutes and responseCount
 * on all Guide, Driver, and Company records for testing badges.
 */
async function main(): Promise<void> {
    console.log("🕐 Seeding response times...");

    // Spread across all badge variants:
    // < 60 min   → success "< 1 hour"
    // 60-180     → success "< 3 hours"
    // 180-1440   → warning "< X hours"
    // > 1440     → muted   "~ X days"
    // null       → no badge
    const responseTimes = [15, 30, 45, 90, 120, 150, 240, 360, 720, 1800, null];

    const pick = (): number | null => responseTimes[Math.floor(Math.random() * responseTimes.length)];
    const randCount = (): number => Math.floor(Math.random() * 40) + 3; // 3-42

    // Guides
    const guides = await prisma.guide.findMany({ select: { id: true } });
    for (const g of guides) {
        const rt = pick();
        await prisma.guide.update({
            where: { id: g.id },
            data: {
                avgResponseTimeMinutes: rt,
                responseCount: rt !== null ? randCount() : 0,
            },
        });
    }
    console.log(`  ✅ ${guides.length} guides updated`);

    // Drivers
    const drivers = await prisma.driver.findMany({ select: { id: true } });
    for (const d of drivers) {
        const rt = pick();
        await prisma.driver.update({
            where: { id: d.id },
            data: {
                avgResponseTimeMinutes: rt,
                responseCount: rt !== null ? randCount() : 0,
            },
        });
    }
    console.log(`  ✅ ${drivers.length} drivers updated`);

    // Companies
    const companies = await prisma.company.findMany({ select: { id: true } });
    for (const c of companies) {
        const rt = pick();
        await prisma.company.update({
            where: { id: c.id },
            data: {
                avgResponseTimeMinutes: rt,
                responseCount: rt !== null ? randCount() : 0,
            },
        });
    }
    console.log(`  ✅ ${companies.length} companies updated`);

    console.log("🎉 Response times seeded!");
}

main()
    .catch((e) => {
        console.error("❌ Seeding failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
