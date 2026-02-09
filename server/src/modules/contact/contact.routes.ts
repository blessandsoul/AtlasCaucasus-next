import type { FastifyInstance } from "fastify";
import { contactController } from "./contact.controller.js";
import { contactFormSchema } from "./contact.schemas.js";
import { validateRequest } from "../../libs/validation.js";

/**
 * Contact Routes
 * Rate limited to 3 requests per hour per IP
 */
export async function contactRoutes(fastify: FastifyInstance): Promise<void> {
  // Rate limiter specifically for contact form
  // 3 requests per hour per IP
  const contactRateLimit = {
    max: 3,
    timeWindow: "1 hour",
  };

  fastify.post(
    "/contact",
    {
      preValidation: validateRequest(contactFormSchema, "body"),
      config: {
        rateLimit: contactRateLimit,
      },
    },
    contactController.submitContactForm.bind(contactController)
  );
}
