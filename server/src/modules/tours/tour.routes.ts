import type { FastifyInstance } from "fastify";
import { authGuard } from "../../middlewares/authGuard.js";
import { requireVerifiedEmail } from "../../middlewares/requireVerifiedEmail.js";
import {
  createTourHandler,
  getTourByIdHandler,
  listMyToursHandler,
  updateTourHandler,
  deleteTourHandler,
  listAllToursHandler,
} from "./tour.controller.js";

interface IdParams {
  id: string;
}

export async function tourRoutes(fastify: FastifyInstance): Promise<void> {
  // Public: list all active tours with filters
  fastify.get("/tours", listAllToursHandler);

  // Public: get a single active tour by ID
  fastify.get<{ Params: IdParams }>("/tours/:id", getTourByIdHandler);

  // Auth required: create a new tour
  fastify.post("/tours", { preHandler: [authGuard, requireVerifiedEmail] }, createTourHandler);

  // Auth required: list current user's tours
  fastify.get("/me/tours", { preHandler: [authGuard, requireVerifiedEmail] }, listMyToursHandler);

  // Auth required: update a tour (owner or admin)
  fastify.patch<{ Params: IdParams }>("/tours/:id", { preHandler: [authGuard, requireVerifiedEmail] }, updateTourHandler);

  // Auth required: soft delete a tour (owner or admin)
  fastify.delete<{ Params: IdParams }>("/tours/:id", { preHandler: [authGuard, requireVerifiedEmail] }, deleteTourHandler);
}
