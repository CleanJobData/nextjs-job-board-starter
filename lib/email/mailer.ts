import { Resend } from "resend";

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface Mailer {
  send(input: SendEmailInput): Promise<void>;
}

/**
 * Resend-backed implementation. Swapping providers (SMTP, SendGrid,
 * Postmark, ...) means implementing this same Mailer interface in a new
 * class and changing what createMailer() returns - nothing that calls
 * requireMailer()/mailer.send() needs to change.
 *
 * Note: if a provider is chosen for its own HOSTED templates (e.g. Brevo's
 * template-by-ID system) rather than "send HTML I already rendered", that's
 * a different shape of call (send(templateId, variables) instead of
 * send(html)) - this interface intentionally does NOT try to abstract that
 * too, since our own templates (lib/email/templates/) render to HTML before
 * ever reaching Mailer. Supporting provider-hosted templates would mean
 * adding a second method here, not changing this one.
 */
class ResendMailer implements Mailer {
  private client: Resend;
  private from: string;

  constructor(apiKey: string, from: string) {
    this.client = new Resend(apiKey);
    this.from = from;
  }

  async send({ to, subject, html, text }: SendEmailInput) {
    const { error } = await this.client.emails.send({
      from: this.from,
      to,
      subject,
      html,
      text,
    });
    if (error) {
      throw new Error(`Failed to send email via Resend: ${error.message}`);
    }
  }
}

let mailer: Mailer | null = null;

function createMailer(): Mailer | null {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) return null;
  return new ResendMailer(apiKey, from);
}

/** Throws with a clear message instead of a null-reference error when a feature needs to send email but RESEND_API_KEY/EMAIL_FROM aren't set. */
export function requireMailer(): Mailer {
  if (!mailer) mailer = createMailer();
  if (!mailer) {
    throw new Error(
      "RESEND_API_KEY or EMAIL_FROM is not set. Any feature that sends email requires both - see .env.example."
    );
  }
  return mailer;
}
