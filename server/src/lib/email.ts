import { env } from '../config/env';

/**
 * Sends a verification code via the Resend REST API. When RESEND_API_KEY
 * isn't set (local dev, tests, or a fresh deploy that hasn't configured it
 * yet), logs the code to the console instead and reports `sent: false` so
 * the caller can hand the code back to the client directly — see
 * auth/service.ts's `devCode`.
 */
export async function sendVerificationEmail(to: string, code: string): Promise<{ sent: boolean }> {
  if (!env.resendApiKey) {
    console.log(`[email] RESEND_API_KEY not set — verification code for ${to}: ${code}`);
    return { sent: false };
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.emailFrom,
      to,
      subject: `${code} is your walkMe verification code`,
      text: `Your walkMe verification code is ${code}. It expires in 10 minutes.`,
      html: `<p>Your walkMe verification code is:</p><p style="font-size:28px;font-weight:600;letter-spacing:4px">${code}</p><p>It expires in 10 minutes. If you didn't request this, you can ignore this email.</p>`,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error(`[email] Resend request failed (${res.status}): ${body}`);
    // Surfaced as a normal 500 by the route's asyncHandler — the caller sees "please try again"
    // rather than a silently-lost code.
    throw new Error(`Failed to send verification email (Resend responded ${res.status})`);
  }

  return { sent: true };
}
