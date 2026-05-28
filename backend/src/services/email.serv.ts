import { Resend } from 'resend';
import { logger } from '../utils/logger.js';

const FROM = process.env.EMAIL_FROM ?? 'CredPlat <noreply@credplat.dev>';

export const sendEmail = async ({ to, subject, html }: { to: string; subject: string; html: string }) => {
  if (!process.env.RESEND_API_KEY) {
    logger.warn({ to }, '[email] RESEND_API_KEY not set — skipping send');
    return;
  }
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({ from: FROM, to, subject, html });
  } catch (err) {
    logger.error({ err, to }, '[email] Failed to send');
  }
};
