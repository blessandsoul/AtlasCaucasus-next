import { PrismaClient } from "@prisma/client";
import { logger } from "./logger.js";

const prismaClientSingleton = () => {
    return new PrismaClient({
        log: [
            { emit: "event", level: "query" },
            { emit: "event", level: "error" },
            { emit: "event", level: "warn" },
        ],
    });
};

declare global {
    // eslint-disable-next-line no-var
    var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
    globalThis.prisma = prisma;
}

// Log queries in development (commented out to reduce noise - uncomment for debugging)
// if (process.env.NODE_ENV === "development") {
//   prisma.$on("query", (e: any) => {
//     logger.debug({ query: e.query, params: e.params, duration: e.duration }, "Prisma Query");
//   });
// }

// Silent error handlers during startup - errors are handled in testDatabaseConnection()
prisma.$on("error", () => {
    // Silently ignore during startup - handled in testDatabaseConnection()
});

prisma.$on("warn", () => {
    // Silently ignore during startup
});

/**
 * Test database connection
 * Returns true if connected, false otherwise
 */
export async function testDatabaseConnection(): Promise<boolean> {
    try {
        await prisma.$queryRaw`SELECT 1`;
        logger.info("Database connection successful");
        return true;
    } catch (error) {
        logger.error({ error }, "Database connection failed");
        return false;
    }
}

export default prisma;
