import { Resend } from "resend";
import { env } from "../config/env.js";
import { logger } from "./logger.js";

/**
 * Email service for sending transactional emails
 * Uses Resend API for production, logs to console in development
 */

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Create Resend client if API key is provided
const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

/**
 * Send an email
 * In development without RESEND_API_KEY, logs to console
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    if (!resend) {
      // Development mode - log email to console
      logger.info(
        {
          to: options.to,
          subject: options.subject,
          preview: options.html.substring(0, 200) + "..."
        },
        "[EMAIL] Email would be sent (dev mode - no RESEND_API_KEY)"
      );
      return true;
    }

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: env.EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    if (error) {
      logger.error(
        { error, to: options.to, subject: options.subject },
        "Failed to send email via Resend"
      );
      return false;
    }

    logger.info(
      { to: options.to, subject: options.subject, emailId: data?.id },
      "Email sent successfully via Resend"
    );
    return true;
  } catch (error) {
    logger.error(
      { error, to: options.to, subject: options.subject },
      "Exception while sending email"
    );
    return false;
  }
}

/**
 * Send email verification email
 */
export async function sendVerificationEmail(
  email: string,
  firstName: string,
  token: string
): Promise<boolean> {
  const verifyUrl = `${env.FRONTEND_URL}/verify-email?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Verify Your Email</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Tourism Georgia</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333;">Hello ${firstName}!</h2>
        <p>Thank you for registering with Tourism Georgia. Please verify your email address to complete your registration.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Verify Email Address
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
        </p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${verifyUrl}" style="color: #667eea;">${verifyUrl}</a>
        </p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: "Verify Your Email - Tourism Georgia",
    html,
    text: `Hello ${firstName}! Please verify your email by visiting: ${verifyUrl}`,
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  firstName: string,
  token: string
): Promise<boolean> {
  const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Reset Your Password</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Tourism Georgia</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333;">Hello ${firstName}!</h2>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Reset Password
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
        </p>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${resetUrl}" style="color: #667eea;">${resetUrl}</a>
        </p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: "Reset Your Password - Tourism Georgia",
    html,
    text: `Hello ${firstName}! Reset your password by visiting: ${resetUrl}`,
  });
}

/**
 * Send security alert email (e.g., when suspicious activity is detected)
 */
export async function sendSecurityAlertEmail(
  email: string,
  firstName: string,
  alertType: "login_from_new_ip" | "password_changed" | "all_sessions_logged_out" | "account_locked" | "account_unlocked",
  details: string
): Promise<boolean> {
  const alertTitles: Record<string, string> = {
    login_from_new_ip: "New Login Detected",
    password_changed: "Password Changed",
    all_sessions_logged_out: "All Sessions Logged Out",
    account_locked: "Account Temporarily Locked",
    account_unlocked: "Account Unlocked",
  };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Security Alert</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #dc3545; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">🔒 Security Alert</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333;">Hello ${firstName},</h2>
        <p><strong>${alertTitles[alertType]}</strong></p>
        <p>${details}</p>
        <p style="color: #666; font-size: 14px; margin-top: 20px;">
          If this wasn't you, please secure your account immediately by changing your password and logging out of all sessions.
        </p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Security Alert: ${alertTitles[alertType]} - Tourism Georgia`,
    html,
    text: `Hello ${firstName}! ${alertTitles[alertType]}: ${details}`,
  });
}

/**
 * Send tour agent invitation email with secure magic link
 * SECURITY: No password is sent in the email - the tour agent sets their own password
 */
export async function sendTourAgentInvitationLink(
  email: string,
  firstName: string,
  invitationToken: string
): Promise<boolean> {
  const acceptUrl = `${env.FRONTEND_URL}/accept-invitation?token=${invitationToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Welcome to Tourism Georgia - Tour Agent Account</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Tourism Georgia</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333;">Welcome ${firstName}!</h2>
        <p>Your company has created a Tour Agent account for you on Tourism Georgia. Click the button below to set up your password and start managing tours.</p>

        <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #667eea;">
          <h3 style="margin-top: 0; color: #667eea;">Your Account</h3>
          <p><strong>Email:</strong> ${email}</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${acceptUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Set Up Your Account
          </a>
        </div>

        <p style="color: #666; font-size: 14px;">
          This invitation link will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.
        </p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${acceptUrl}" style="color: #667eea;">${acceptUrl}</a>
        </p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: "Set Up Your Tour Agent Account - Tourism Georgia",
    html,
    text: `Hello ${firstName}! Your tour agent account has been created. Please set up your password by visiting: ${acceptUrl}. This link expires in 7 days.`,
  });
}

/**
 * Send email when a provider receives a new inquiry
 */
export async function sendInquiryReceivedEmail(
  recipientEmail: string,
  recipientFirstName: string,
  senderName: string,
  subject: string,
  messagePreview: string,
  inquiryId: string
): Promise<boolean> {
  const inquiryUrl = `${env.FRONTEND_URL}/dashboard/inquiries/${inquiryId}`;
  const preview = messagePreview.substring(0, 200);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Inquiry Received</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Tourism Georgia</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333;">Hello ${recipientFirstName}!</h2>
        <p>You have received a new inquiry from <strong>${senderName}</strong>.</p>

        <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #667eea;">
          <h3 style="margin-top: 0; color: #667eea;">${subject}</h3>
          <p style="color: #555;">${preview}${messagePreview.length > 200 ? "..." : ""}</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${inquiryUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            View & Respond to Inquiry
          </a>
        </div>

        <p style="color: #666; font-size: 14px;">
          Responding quickly helps build trust with potential customers.
        </p>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${inquiryUrl}" style="color: #667eea;">${inquiryUrl}</a>
        </p>
        <p style="color: #999; font-size: 11px; margin-top: 20px; border-top: 1px solid #eee; padding-top: 15px;">
          You are receiving this email because you have an account on Tourism Georgia. To manage your email preferences, visit your profile settings.
        </p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: recipientEmail,
    subject: `New inquiry: ${subject}`,
    html,
    text: `Hello ${recipientFirstName}! You have a new inquiry from ${senderName}: "${subject}". ${preview}. View and respond: ${inquiryUrl}`,
  });
}

/**
 * Send email when a user's inquiry gets a response
 */
export async function sendInquiryResponseEmail(
  userEmail: string,
  userFirstName: string,
  providerName: string,
  status: "ACCEPTED" | "DECLINED" | "RESPONDED",
  responseMessage: string | null,
  inquiryId: string
): Promise<boolean> {
  const inquiryUrl = `${env.FRONTEND_URL}/dashboard/inquiries/${inquiryId}`;

  const statusLabels: Record<string, string> = {
    ACCEPTED: "accepted",
    DECLINED: "declined",
    RESPONDED: "responded to",
  };

  const statusColors: Record<string, string> = {
    ACCEPTED: "#22c55e",
    DECLINED: "#ef4444",
    RESPONDED: "#667eea",
  };

  const statusLabel = statusLabels[status];
  const statusColor = statusColors[status];

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Response to Your Inquiry</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Tourism Georgia</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333;">Hello ${userFirstName}!</h2>
        <p><strong>${providerName}</strong> has <span style="color: ${statusColor}; font-weight: bold;">${statusLabel}</span> your inquiry.</p>

        ${responseMessage ? `
        <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid ${statusColor};">
          <p style="color: #555; margin: 0;">${responseMessage.substring(0, 500)}${responseMessage.length > 500 ? "..." : ""}</p>
        </div>
        ` : ""}

        <div style="text-align: center; margin: 30px 0;">
          <a href="${inquiryUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            View Inquiry Details
          </a>
        </div>

        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${inquiryUrl}" style="color: #667eea;">${inquiryUrl}</a>
        </p>
        <p style="color: #999; font-size: 11px; margin-top: 20px; border-top: 1px solid #eee; padding-top: 15px;">
          You are receiving this email because you have an account on Tourism Georgia. To manage your email preferences, visit your profile settings.
        </p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: userEmail,
    subject: `Response to your inquiry - ${providerName} ${statusLabel} your request`,
    html,
    text: `Hello ${userFirstName}! ${providerName} has ${statusLabel} your inquiry.${responseMessage ? ` Message: "${responseMessage.substring(0, 200)}"` : ""} View details: ${inquiryUrl}`,
  });
}

/**
 * Send email when a chat message is received while user is offline
 */
export async function sendChatMessageEmail(
  recipientEmail: string,
  recipientFirstName: string,
  senderName: string,
  messagePreview: string,
  chatId: string
): Promise<boolean> {
  const chatUrl = `${env.FRONTEND_URL}/dashboard/chat/${chatId}`;
  const preview = messagePreview.substring(0, 200);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Message</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Tourism Georgia</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333;">Hello ${recipientFirstName}!</h2>
        <p>You have a new message from <strong>${senderName}</strong>.</p>

        <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #667eea;">
          <p style="color: #555; margin: 0;">${preview}${messagePreview.length > 200 ? "..." : ""}</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${chatUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            View Conversation
          </a>
        </div>

        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${chatUrl}" style="color: #667eea;">${chatUrl}</a>
        </p>
        <p style="color: #999; font-size: 11px; margin-top: 20px; border-top: 1px solid #eee; padding-top: 15px;">
          You are receiving this email because you have an account on Tourism Georgia. To manage your email preferences, visit your profile settings.
        </p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: recipientEmail,
    subject: `New message from ${senderName} - Tourism Georgia`,
    html,
    text: `Hello ${recipientFirstName}! You have a new message from ${senderName}: "${preview}". View conversation: ${chatUrl}`,
  });
}

/**
 * Send booking confirmation email to user
 */
export async function sendBookingConfirmedEmail(
  userEmail: string,
  userFirstName: string,
  providerName: string,
  entityType: string,
  bookingId: string
): Promise<boolean> {
  const bookingUrl = `${env.FRONTEND_URL}/dashboard/bookings`;
  const entityLabel = entityType.charAt(0) + entityType.slice(1).toLowerCase();

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Booking Confirmed</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Booking Confirmed!</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333;">Hello ${userFirstName}!</h2>
        <p>Great news! <strong>${providerName}</strong> has accepted your inquiry and your ${entityLabel.toLowerCase()} booking has been confirmed.</p>

        <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #22c55e;">
          <p style="margin: 0; color: #555;">Your booking is now confirmed. You can view the details and manage your bookings from your dashboard.</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${bookingUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            View My Bookings
          </a>
        </div>

        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${bookingUrl}" style="color: #667eea;">${bookingUrl}</a>
        </p>
        <p style="color: #999; font-size: 11px; margin-top: 20px; border-top: 1px solid #eee; padding-top: 15px;">
          You are receiving this email because you have an account on Tourism Georgia. To manage your email preferences, visit your profile settings.
        </p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: userEmail,
    subject: `Booking Confirmed - ${providerName}`,
    html,
    text: `Hello ${userFirstName}! Your booking with ${providerName} has been confirmed. View your bookings: ${bookingUrl}`,
  });
}

/**
 * Send email to provider when a customer creates a direct booking
 */
export async function sendNewBookingRequestEmail(
  providerEmail: string,
  providerFirstName: string,
  customerName: string,
  entityName: string,
  bookingDate: string | null,
  guests: number | null,
  referenceNumber: string | null
): Promise<boolean> {
  const dashboardUrl = `${env.FRONTEND_URL}/dashboard/bookings/received`;
  const formattedDate = bookingDate
    ? new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric" }).format(new Date(bookingDate))
    : "Not specified";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Booking Request</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">New Booking Request</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333;">Hello ${providerFirstName}!</h2>
        <p><strong>${customerName}</strong> has requested to book <strong>${entityName}</strong>.</p>

        <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #667eea;">
          ${referenceNumber ? `<p style="margin: 5px 0;"><strong>Reference:</strong> ${referenceNumber}</p>` : ""}
          <p style="margin: 5px 0;"><strong>Date:</strong> ${formattedDate}</p>
          ${guests ? `<p style="margin: 5px 0;"><strong>Guests:</strong> ${guests}</p>` : ""}
        </div>

        <p>Please review and respond to this booking request from your dashboard.</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${dashboardUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            View Booking Request
          </a>
        </div>

        <p style="color: #666; font-size: 14px;">
          Responding quickly helps build trust with customers.
        </p>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${dashboardUrl}" style="color: #667eea;">${dashboardUrl}</a>
        </p>
        <p style="color: #999; font-size: 11px; margin-top: 20px; border-top: 1px solid #eee; padding-top: 15px;">
          You are receiving this email because you have an account on Tourism Georgia.
        </p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: providerEmail,
    subject: `New booking request for ${entityName}`,
    html,
    text: `Hello ${providerFirstName}! ${customerName} has requested to book ${entityName}. Date: ${formattedDate}. ${guests ? `Guests: ${guests}.` : ""} View and respond: ${dashboardUrl}`,
  });
}

/**
 * Send email to customer when provider confirms a booking
 */
export async function sendBookingConfirmedNotificationEmail(
  customerEmail: string,
  customerFirstName: string,
  providerName: string,
  entityName: string,
  bookingId: string,
  referenceNumber: string | null,
  bookingDate: string | null,
  guests: number | null,
  providerNotes: string | null
): Promise<boolean> {
  const bookingUrl = `${env.FRONTEND_URL}/dashboard/bookings/${bookingId}`;
  const formattedDate = bookingDate
    ? new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric" }).format(new Date(bookingDate))
    : null;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Booking Confirmed</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Booking Confirmed!</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333;">Hello ${customerFirstName}!</h2>
        <p>Great news! Your booking for <strong>${entityName}</strong> has been confirmed by <strong>${providerName}</strong>.</p>

        <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #22c55e;">
          ${referenceNumber ? `<p style="margin: 5px 0;"><strong>Reference:</strong> ${referenceNumber}</p>` : ""}
          ${formattedDate ? `<p style="margin: 5px 0;"><strong>Date:</strong> ${formattedDate}</p>` : ""}
          ${guests ? `<p style="margin: 5px 0;"><strong>Guests:</strong> ${guests}</p>` : ""}
          ${providerNotes ? `<p style="margin: 10px 0 0 0;"><strong>Note from provider:</strong></p><p style="color: #555; margin: 5px 0;">${providerNotes}</p>` : ""}
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${bookingUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            View Booking
          </a>
        </div>

        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${bookingUrl}" style="color: #667eea;">${bookingUrl}</a>
        </p>
        <p style="color: #999; font-size: 11px; margin-top: 20px; border-top: 1px solid #eee; padding-top: 15px;">
          You are receiving this email because you have an account on Tourism Georgia.
        </p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: customerEmail,
    subject: `Booking Confirmed - ${entityName}`,
    html,
    text: `Hello ${customerFirstName}! Your booking for ${entityName} has been confirmed by ${providerName}. ${referenceNumber ? `Reference: ${referenceNumber}.` : ""} View booking: ${bookingUrl}`,
  });
}

/**
 * Send email to customer when provider declines a booking
 */
export async function sendBookingDeclinedEmail(
  customerEmail: string,
  customerFirstName: string,
  providerName: string,
  entityName: string,
  declinedReason: string
): Promise<boolean> {
  const exploreUrl = `${env.FRONTEND_URL}/explore/tours`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Booking Update</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #6b7280; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Booking Update</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333;">Hello ${customerFirstName},</h2>
        <p><strong>${providerName}</strong> was unable to accept your booking for <strong>${entityName}</strong>.</p>

        <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #6b7280;">
          <p style="margin: 0; color: #555;"><strong>Reason:</strong> ${declinedReason}</p>
        </div>

        <p>Don't worry — there are many other great options available!</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${exploreUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Browse Other Tours
          </a>
        </div>

        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${exploreUrl}" style="color: #667eea;">${exploreUrl}</a>
        </p>
        <p style="color: #999; font-size: 11px; margin-top: 20px; border-top: 1px solid #eee; padding-top: 15px;">
          You are receiving this email because you have an account on Tourism Georgia.
        </p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: customerEmail,
    subject: `Booking Update - ${entityName}`,
    html,
    text: `Hello ${customerFirstName}! ${providerName} was unable to accept your booking for ${entityName}. Reason: ${declinedReason}. Browse other tours: ${exploreUrl}`,
  });
}

/**
 * Send email to provider when customer cancels a booking
 */
export async function sendBookingCancelledEmail(
  providerEmail: string,
  providerFirstName: string,
  customerName: string,
  entityName: string,
  referenceNumber: string | null,
  bookingDate: string | null
): Promise<boolean> {
  const dashboardUrl = `${env.FRONTEND_URL}/dashboard/bookings/received`;
  const formattedDate = bookingDate
    ? new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric" }).format(new Date(bookingDate))
    : null;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Booking Cancelled</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #ef4444; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Booking Cancelled</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333;">Hello ${providerFirstName},</h2>
        <p><strong>${customerName}</strong> has cancelled their booking for <strong>${entityName}</strong>.</p>

        <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ef4444;">
          ${referenceNumber ? `<p style="margin: 5px 0;"><strong>Reference:</strong> ${referenceNumber}</p>` : ""}
          ${formattedDate ? `<p style="margin: 5px 0;"><strong>Date:</strong> ${formattedDate}</p>` : ""}
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${dashboardUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            View Bookings
          </a>
        </div>

        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${dashboardUrl}" style="color: #667eea;">${dashboardUrl}</a>
        </p>
        <p style="color: #999; font-size: 11px; margin-top: 20px; border-top: 1px solid #eee; padding-top: 15px;">
          You are receiving this email because you have an account on Tourism Georgia.
        </p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: providerEmail,
    subject: `Booking Cancelled - ${entityName}`,
    html,
    text: `Hello ${providerFirstName}! ${customerName} has cancelled their booking for ${entityName}. ${referenceNumber ? `Reference: ${referenceNumber}.` : ""} View bookings: ${dashboardUrl}`,
  });
}

/**
 * Send email to customer when provider marks booking as completed
 */
export async function sendBookingCompletedEmail(
  customerEmail: string,
  customerFirstName: string,
  entityName: string,
  referenceNumber: string | null,
  entityType: string,
  entityId: string
): Promise<boolean> {
  const entityPath = entityType === "TOUR" ? "tours" : entityType === "GUIDE" ? "guides" : "drivers";
  const reviewUrl = `${env.FRONTEND_URL}/explore/${entityPath}/${entityId}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Booking Complete</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Booking Complete!</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333;">Hello ${customerFirstName}!</h2>
        <p>Your booking for <strong>${entityName}</strong> is now complete.</p>

        <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #22c55e;">
          ${referenceNumber ? `<p style="margin: 5px 0;"><strong>Reference:</strong> ${referenceNumber}</p>` : ""}
          <p style="margin: 5px 0;">We hope you had a great experience!</p>
        </div>

        <p>Your feedback helps other travelers. Consider leaving a review!</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${reviewUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Leave a Review
          </a>
        </div>

        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${reviewUrl}" style="color: #667eea;">${reviewUrl}</a>
        </p>
        <p style="color: #999; font-size: 11px; margin-top: 20px; border-top: 1px solid #eee; padding-top: 15px;">
          You are receiving this email because you have an account on Tourism Georgia.
        </p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: customerEmail,
    subject: `Booking Complete - ${entityName}`,
    html,
    text: `Hello ${customerFirstName}! Your booking for ${entityName} is complete. ${referenceNumber ? `Reference: ${referenceNumber}.` : ""} Leave a review: ${reviewUrl}`,
  });
}

/**
 * Send contact form submission email to admin
 */
export async function sendContactFormEmail(
  name: string,
  email: string,
  subject: string,
  message: string,
  adminEmail: string
): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Contact Form Submission</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Contact Form Submission</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333;">New Contact Form Submission</h2>
        <p>You have received a new message from the AtlasCaucasus contact form.</p>

        <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #667eea;">
          <p style="margin: 5px 0;"><strong>From:</strong> ${name}</p>
          <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
          <p style="margin: 5px 0;"><strong>Subject:</strong> ${subject}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 15px 0;">
          <p style="margin: 10px 0 0 0;"><strong>Message:</strong></p>
          <p style="color: #555; white-space: pre-wrap;">${message}</p>
        </div>

        <p style="color: #666; font-size: 14px;">
          Reply to this inquiry by responding directly to ${email}.
        </p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: adminEmail,
    subject: `Contact Form: ${subject}`,
    html,
    text: `New contact form submission from ${name} (${email}):\n\nSubject: ${subject}\n\nMessage:\n${message}`,
  });
}
