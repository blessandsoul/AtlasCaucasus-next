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
  const verifyUrl = `${env.FRONTEND_URL || "http://localhost:3000"}/verify-email?token=${token}`;

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
  const resetUrl = `${env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${token}`;

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
  alertType: "login_from_new_ip" | "password_changed" | "all_sessions_logged_out" | "account_locked",
  details: string
): Promise<boolean> {
  const alertTitles: Record<string, string> = {
    login_from_new_ip: "New Login Detected",
    password_changed: "Password Changed",
    all_sessions_logged_out: "All Sessions Logged Out",
    account_locked: "Account Temporarily Locked",
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
 * Send tour agent invitation email with temporary credentials
 */
export async function sendTourAgentInvitation(
  email: string,
  firstName: string,
  temporaryPassword: string
): Promise<boolean> {
  const loginUrl = `${env.FRONTEND_URL || "http://localhost:3000"}/login`;

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
        <p>Your company has created a Tour Agent account for you on Tourism Georgia. You can now log in and start managing tours.</p>
        
        <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #667eea;">
          <h3 style="margin-top: 0; color: #667eea;">Your Login Credentials</h3>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Temporary Password:</strong> <code style="background: #f0f0f0; padding: 5px 10px; border-radius: 3px;">${temporaryPassword}</code></p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${loginUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Log In Now
          </a>
        </div>
        
        <p style="color: #dc3545; font-weight: bold;">⚠️ Important: Please change your password after your first login!</p>
        
        <p style="color: #666; font-size: 14px;">
          If you have any questions, please contact your company administrator.
        </p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: "Your Tour Agent Account - Tourism Georgia",
    html,
    text: `Hello ${firstName}! Your tour agent account has been created. Email: ${email}, Temporary Password: ${temporaryPassword}. Please login at ${loginUrl} and change your password.`,
  });
}
