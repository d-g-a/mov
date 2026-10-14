import { createHash } from "node:crypto";

/**
 * Newsletter signup → Mailchimp audience.
 *
 * Env:
 * - MAILCHIMP_API_KEY       (secret; ends in the data center, e.g. "…-us21")
 * - MAILCHIMP_AUDIENCE_ID   (Audience → Settings → Audience name and defaults)
 * - MAILCHIMP_DOUBLE_OPT_IN "true" sends a confirmation email first; otherwise people are added directly
 * - MAILCHIMP_TAG           optional tag added to each signup, e.g. "website"
 *
 * Responds with { status: "pending" | "subscribed" | "already" | "unsubscribed" } or { error: string }.
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
    return Response.json({ status: "subscribed" });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL.test(email) || email.length > 254) {
    return Response.json({ error: "invalid_email" }, { status: 400 });
  }

  // Single opt-in by default. The audience's "double opt-in" setting in Mailchimp
  // only affects Mailchimp's hosted forms; via the API, the status we send decides.
  const doubleOptIn = process.env.MAILCHIMP_DOUBLE_OPT_IN === "true";
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
    let member = (await res.json()) as { status?: string; title?: string };

    if (!res.ok) {
      // Mailchimp rejects fake-looking or blocked addresses with 400 "Invalid Resource"
      if (res.status === 400) return Response.json({ error: "invalid_email" }, { status: 400 });
      console.error("Mailchimp error", res.status, member.title);
      return Response.json({ error: "upstream" }, { status: 502 });
    }

    // Someone who signed up earlier and never confirmed stays "pending" (status_if_new
    // doesn't touch existing contacts). With single opt-in, subscribe them now.
    if (!doubleOptIn && member.status === "pending") {
      const patch = await fetch(memberUrl, { method: "PATCH", headers, body: JSON.stringify({ status: "subscribed" }) });
      if (patch.ok) member = (await patch.json()) as typeof member;
      else console.error("Mailchimp pending -> subscribed failed", patch.status);
    }

    const tag = process.env.MAILCHIMP_TAG;
    if (tag) {
      await fetch(`${memberUrl}/tags`, {
        method: "POST",
        headers,
        body: JSON.stringify({ tags: [{ name: tag, status: "active" }] }),
      }).catch((e) => console.error("Mailchimp tag error", e));
    }

    if (member.status === "unsubscribed" || member.status === "cleaned") {
      // Opted out (or bounced) earlier: we don't re-add them from here
      return Response.json({ status: "unsubscribed" });
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
