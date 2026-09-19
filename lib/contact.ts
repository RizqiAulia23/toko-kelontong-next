// lib/contact.ts — server-side only
import { query } from "./db";

export interface ContactSubmission {
  name: string;
  email: string;
  message: string;
}

export async function submitContact(
  name: string,
  email: string,
  message: string
): Promise<boolean> {
  await query(
    "INSERT INTO tb_message (name, email, message, date_sent) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)",
    [name.slice(0, 100), email.slice(0, 100), message]
  );
  return true;
}
