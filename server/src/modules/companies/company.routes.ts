import type { FastifyInstance } from "fastify";
import * as companyController from "./company.controller.js";
import { listCompanyToursHandler } from "../tours/tour.controller.js";
import { authGuard } from "../../middlewares/authGuard.js";
import { requireVerifiedEmail } from "../../middlewares/requireVerifiedEmail.js";

export async function companyRoutes(fastify: FastifyInstance): Promise<void> {
    // Public: List all companies (paginated, filterable)
    fastify.get("/companies", companyController.list);

    // Auth required: Get current user's company
    fastify.get(
        "/companies/my",
        { preHandler: [authGuard] },
        companyController.getMyCompany
    );

    // Public: Get company by ID
    fastify.get("/companies/:id", companyController.getById);

    // Auth required: Update company (ownership checked in service)
    fastify.patch(
        "/companies/:id",
        { preHandler: [authGuard, requireVerifiedEmail] },
        companyController.update
    );

    // Auth required: Delete company (ownership checked in service)
    fastify.delete(
        "/companies/:id",
        { preHandler: [authGuard, requireVerifiedEmail] },
        companyController.deleteCompany
    );

    // Auth required: Get tour agents for company (ownership checked in service)
    fastify.get(
        "/companies/:id/tour-agents",
        { preHandler: [authGuard] },
        companyController.getTourAgents
    );

    // Auth required: Delete a tour agent (ownership checked in service)
    fastify.delete(
        "/companies/:id/tour-agents/:agentId",
        { preHandler: [authGuard, requireVerifiedEmail] },
        companyController.deleteTourAgent
    );

    // Public: List active tours for a company
    fastify.get("/companies/:id/tours", listCompanyToursHandler);

    // ==========================================
    // PHOTO MANAGEMENT
    // ==========================================

    // Public: Get all photos for a company
    fastify.get("/companies/:id/photos", companyController.getPhotos);

    // Auth required: Upload photos for company (ownership checked in helper)
    fastify.post(
        "/companies/:id/photos",
        { preHandler: [authGuard, requireVerifiedEmail] },
        companyController.uploadPhotos
    );

    // Auth required: Delete a specific photo (ownership checked in helper)
    fastify.delete(
        "/companies/:id/photos/:photoId",
        { preHandler: [authGuard, requireVerifiedEmail] },
        companyController.deletePhoto
    );

    // ==========================================
    // LOGO MANAGEMENT
    // ==========================================

    // Auth required: Upload logo for company (ownership checked in service)
    fastify.post(
        "/companies/:id/logo",
        { preHandler: [authGuard, requireVerifiedEmail] },
        companyController.uploadLogo
    );

    // Auth required: Delete company logo (ownership checked in service)
    fastify.delete(
        "/companies/:id/logo",
        { preHandler: [authGuard, requireVerifiedEmail] },
        companyController.deleteLogo
    );
}
