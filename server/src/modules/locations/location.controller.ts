import type { FastifyRequest, FastifyReply } from "fastify";
import { successResponse, paginatedResponse } from "../../libs/response.js";
import { ValidationError } from "../../libs/errors.js";
import * as locationService from "./location.service.js";
import {
    createLocationSchema,
    updateLocationSchema,
    locationQuerySchema,
} from "./location.schemas.js";

export async function create(
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> {
    const parsed = createLocationSchema.safeParse(request.body);
    if (!parsed.success) {
        throw new ValidationError(parsed.error.errors[0].message);
    }

    const location = await locationService.createLocation(parsed.data);

    return reply.status(201).send(
        successResponse("Location created successfully", location)
    );
}

export async function list(
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> {
    const parsed = locationQuerySchema.safeParse(request.query);
    if (!parsed.success) {
        throw new ValidationError(parsed.error.errors[0].message);
    }

    const { page, limit, ...filters } = parsed.data;

    const { locations, total } = await locationService.getLocations(
        filters,
        page,
        limit
    );

    return reply.send(
        paginatedResponse("Locations retrieved successfully", locations, page, limit, total)
    );
}

export async function getById(
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> {
    const { id } = request.params as { id: string };

    const location = await locationService.getLocationById(id);

    return reply.send(
        successResponse("Location retrieved successfully", location)
    );
}

export async function update(
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> {
    const { id } = request.params as { id: string };

    const parsed = updateLocationSchema.safeParse(request.body);
    if (!parsed.success) {
        throw new ValidationError(parsed.error.errors[0].message);
    }

    const location = await locationService.updateLocation(id, parsed.data);

    return reply.send(
        successResponse("Location updated successfully", location)
    );
}

export async function deleteLocation(
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> {
    const { id } = request.params as { id: string };

    await locationService.deleteLocation(id);

    return reply.send(
        successResponse("Location deleted successfully", null)
    );
}
