import type { FastifyRequest, FastifyReply } from "fastify";
import { contactService } from "./contact.service.js";
import { successResponse } from "../../libs/response.js";
import type { ContactFormInput } from "./contact.schemas.js";

/**
 * Contact Controller - handles HTTP requests for contact form
 */
class ContactController {
  /**
   * POST /api/v1/contact
   * Submit contact form
   */
  async submitContactForm(
    request: FastifyRequest<{ Body: ContactFormInput }>,
    reply: FastifyReply
  ): Promise<void> {
    await contactService.submitContactForm(request.body);

    reply.send(
      successResponse(
        "Your message has been sent successfully. We'll get back to you soon!",
        null
      )
    );
  }
}

export const contactController = new ContactController();
