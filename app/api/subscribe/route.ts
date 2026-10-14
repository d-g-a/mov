import { createHash } from "node:crypto";

/**
 * Newsletter signup → Mailchimp audience.
 *
 * Env:
 * - MAILCHIMP_API_KEY       (secret; ends in the data center, e.g. "…-us21")
 * - MAILCHIMP_AUDIENCE_ID   (Audience → Settings → Audience name and defaults)
 * - MAILCHIMP_DOUBLE_OPT_IN "false" adds people directly; anything else sends a confirmation email first
 * - MAILCHIMP_TAG           optional tag added to each signup, e.g. "website"
 *
 * Responds with { status: "pending" | "subscribed" | "already" } or { error: string }.
 */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const apiKey = process.env.MAILCHIMP_API_KEY;
  const audienceId = process.env.MAILCHIMP_AUDIENCE_ID;
  const dataCenter = apiKey?.split("-")[1];
  if (!apiKey || !audienceId || !dataCenter) {
    return Response.json({ error: "not_configured" }, { status: 503 });
  }

  let body: { email?: unknown; company?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_email" }, { status: 400 });
  }

  // Honeypot: real visitors never see or fill this field
  if (typeof body.company === "string" && body.company !== "") {
    return Response.json({ status: "pending" });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL.test(email) || email.length > 254) {
    return Response.json({ error: "invalid_email" }, { status: 400 });
  }

  const doubleOptIn = process.env.MAILCHIMP_DOUBLE_OPT_IN !== "false";
  const memberUrl = `https://${dataCenter}.api.mailchimp.com/3.0/lists/${audienceId}/members/${createHash("md5").update(email).digest("hex")}`;
  const headers = {
    Authorization: `Basic ${Buffer.from(`lamovida:${apiKey}`).toString("base64")}`,
    "Content-Type": "application/json",
  };

  try {
    // Upsert: status_if_new only applies to new contacts, so people who
    // unsubscribed are never resubscribed from here.
    const res = await fetch(memberUrl, {
      method: "PUT",
      headers,
      body: JSON.stringify({ email_address: email, status_if_new: doubleOptIn ? "pending" : "subscribed" }),
    });
    const member = (await res.json()) as { status?: string; title?: string };

    if (!res.ok) {
      // Mailchimp rejects fake-looking or blocked addresses with 400 "Invalid Resource"
      if (res.status === 400) return Response.json({ error: "invalid_email" }, { status: 400 });
      console.error("Mailchimp error", res.status, member.title);
      return Response.json({ error: "upstream" }, { status: 502 });
    }

    const tag = process.env.MAILCHIMP_TAG;
    if (tag) {
      await fetch(`${memberUrl}/tags`, {
        method: "POST",
        headers,
        body: JSON.stringify({ tags: [{ name: tag, status: "active" }] }),
      }).catch((e) => console.error("Mailchimp tag error", e));
    }

    if (member.status === "subscribed" && doubleOptIn) {
      // With double opt-in, a new contact comes back "pending"; "subscribed" means they already were
      return Response.json({ status: "already" });
    }
    return Response.json({ status: member.status === "pending" ? "pending" : "subscribed" });
  } catch (e) {
    console.error("Mailchimp request failed", e);
    return Response.json({ error: "upstream" }, { status: 502 });
  }
}
