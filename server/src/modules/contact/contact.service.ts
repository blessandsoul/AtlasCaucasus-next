import { sendContactFormEmail } from "../../libs/email.js";
import { env } from "../../config/env.js";
import { logger } from "../../libs/logger.js";
import type { ContactFormInput } from "./contact.schemas.js";

/**
 * Contact Service - handles contact form submissions
 */
class ContactService {
  /**
   * Process contact form submission
   * Sends email to admin email address
   */
  async submitContactForm(data: ContactFormInput): Promise<void> {
    const adminEmail = env.ADMIN_EMAIL || env.EMAIL_FROM;

    logger.info(
      {
        from: data.email,
        subject: data.subject,
      },
      "Processing contact form submission"
    );

    // Send email to admin (fire-and-forget, don't fail request if email fails)
    sendContactFormEmail(
      data.name,
      data.email,
      data.subject,
      data.message,
      adminEmail
    ).catch((error) => {
      logger.error(
        { error, data },
        "Failed to send contact form email"
      );
    });
  }
}

export const contactService = new ContactService();
