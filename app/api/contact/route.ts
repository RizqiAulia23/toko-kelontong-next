// app/api/contact/route.ts
import { NextRequest, NextResponse } from "next/server";
import { submitContact } from "@/lib/contact";

// Simple in-memory rate limiter: 1 submission per 10 seconds per IP
const rateLimit = new Map<string, number>();

function isValidRequestOrigin(req: NextRequest): boolean {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  if (!host) return false;

  const origin = req.headers.get("origin");
  if (origin) {
    try {
      return new URL(origin).host === host;
    } catch {
      return false;
    }
  }

  const referer = req.headers.get("referer");
  if (referer) {
    try {
      return new URL(referer).host === host;
    } catch {
      return false;
    }
  }

  return false;
}

export async function POST(req: NextRequest) {
  try {
    // Request origin / CSRF protection
    if (!isValidRequestOrigin(req)) {
      return NextResponse.json(
        { error: "Forbidden: invalid request origin." },
        { status: 403 }
      );
    }

    let body: { name?: unknown; email?: unknown; message?: unknown };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Malformed request body." },
        { status: 400 }
      );
    }
    const { name, email, message } = body;

    // Validation
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }
    if (name.trim().length > 100) {
      return NextResponse.json({ error: "Name too long." }, { status: 400 });
    }
    if (!email || typeof email !== "string" || email.trim().length === 0) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }
    if (email.trim().length > 100) {
      return NextResponse.json({ error: "Email too long." }, { status: 400 });
    }
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
    }
    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }
    if (message.trim().length < 5) {
      return NextResponse.json({ error: "Message content is too short. Please elaborate." }, { status: 400 });
    }

    // Rate limit check (per IP)
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const now = Date.now();
    const lastSent = rateLimit.get(ip) ?? 0;
    if (now - lastSent < 10000) {
      return NextResponse.json({ error: "Please wait a moment before sending another message." }, { status: 429 });
    }
    
    // Prune stale records if map grows large to prevent memory leak in long-running instances
    if (rateLimit.size > 500) {
      for (const [key, timestamp] of rateLimit.entries()) {
        if (now - timestamp > 60000) {
          rateLimit.delete(key);
        }
      }
    }
    rateLimit.set(ip, now);

    await submitContact(name.trim(), email.trim(), message.trim());

    return NextResponse.json({ success: true, message: "Message transmitted. Our retail desk will respond shortly." });
  } catch (err) {
    console.error("Contact submission error:", err);
    return NextResponse.json({ error: "Failed to send message. Please try again." }, { status: 500 });
  }
}
