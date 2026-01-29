import { prisma } from "./prisma.js";
import type { UserRole } from "../modules/users/user.types.js";

/**
 * Verify if user owns a company or is admin
 */
export async function verifyCompanyOwnership(
    companyId: string,
    userId: string,
    userRoles: UserRole[]
): Promise<boolean> {
    // Admins can do anything
    if (userRoles.includes("ADMIN")) {
        return true;
    }

    // Check if user owns this company
    const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: { userId: true },
    });

    return company?.userId === userId;
}

/**
 * Verify if user owns a guide profile or is admin
 */
export async function verifyGuideOwnership(
    guideId: string,
    userId: string,
    userRoles: UserRole[]
): Promise<boolean> {
    // Admins can do anything
    if (userRoles.includes("ADMIN")) {
        return true;
    }

    // Check if user owns this guide profile
    const guide = await prisma.guide.findUnique({
        where: { id: guideId },
        select: { userId: true },
    });

    return guide?.userId === userId;
}

/**
 * Verify if user owns a driver profile or is admin
 */
export async function verifyDriverOwnership(
    driverId: string,
    userId: string,
    userRoles: UserRole[]
): Promise<boolean> {
    // Admins can do anything
    if (userRoles.includes("ADMIN")) {
        return true;
    }

    // Check if user owns this driver profile
    const driver = await prisma.driver.findUnique({
        where: { id: driverId },
        select: { userId: true },
    });

    return driver?.userId === userId;
}

/**
 * Verify if user owns a tour or is admin or is company owner
 */
export async function verifyTourOwnership(
    tourId: string,
    userId: string,
    userRoles: UserRole[]
): Promise<boolean> {
    // Admins can do anything
    if (userRoles.includes("ADMIN")) {
        return true;
    }

    const tour = await prisma.tour.findUnique({
        where: { id: tourId },
        select: {
            ownerId: true,
            companyId: true,
        },
    });

    if (!tour) {
        return false;
    }

    // Check if user is the tour owner
    if (tour.ownerId === userId) {
        return true;
    }

    // If tour has a company, check if user owns that company
    if (tour.companyId) {
        const company = await prisma.company.findUnique({
            where: { id: tour.companyId },
            select: { userId: true },
        });

        if (company?.userId === userId) {
            return true;
        }
    }

    return false;
}
