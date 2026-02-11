import type { FastifyInstance } from "fastify";
import { authGuard } from "../../middlewares/authGuard.js";
import {
  createTourHandler,
  getTourByIdHandler,
  listMyToursHandler,
  updateTourHandler,
  deleteTourHandler,
  listAllToursHandler,
  getRelatedToursHandler,
} from "./tour.controller.js";
import { bookingController } from "../bookings/booking.controller.js";

interface IdParams {
  id: string;
}

export async function tourRoutes(fastify: FastifyInstance): Promise<void> {
  // Public: list all active tours with filters
  fastify.get("/tours", listAllToursHandler);

  // Public: get a single active tour by ID
  fastify.get<{ Params: IdParams }>("/tours/:id", getTourByIdHandler);

  // Public: get related tours for a tour
  fastify.get<{ Params: IdParams }>("/tours/:id/related", getRelatedToursHandler);

  // Auth required: create a new tour
  fastify.post("/tours", { preHandler: [authGuard] }, createTourHandler);

  // Auth required: list current user's tours
  fastify.get("/me/tours", { preHandler: [authGuard] }, listMyToursHandler);

  // Auth required: update a tour (owner or admin)
  fastify.patch<{ Params: IdParams }>("/tours/:id", { preHandler: [authGuard] }, updateTourHandler);

  // Auth required: soft delete a tour (owner or admin)
  fastify.delete<{ Params: IdParams }>("/tours/:id", { preHandler: [authGuard] }, deleteTourHandler);

  // Public: check tour availability for a date and guest count
  fastify.get<{ Params: IdParams }>(
    "/tours/:id/availability",
    {
      config: {
        rateLimit: {
          max: 60,
          timeWindow: "1 minute",
        },
      },
    },
    bookingController.checkAvailability.bind(bookingController)
  );
}
