// lib/session.ts
// iron-session configuration for VLONIX authentication

import { SessionOptions } from "iron-session";

export interface SessionData {
  adminId: number;
  adminName: string;
  username: string;
  adminEmail: string;
  level: "admin" | "pelanggan";
}

export const sessionOptions: SessionOptions = {
  password: process.env.ENCRYPTION_KEY || "",
  cookieName: "vlonix_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};

  if (!sessionOptions.password || sessionOptions.password.length === 0) {
  console.warn(
    "⚠️  ENCRYPTION_KEY is not set or too short. Session encryption may not be secure."
  );
}
