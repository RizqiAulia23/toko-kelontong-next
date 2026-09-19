// lib/messages.ts — server-side only
import { query, queryOne, queryScalar } from "./db";

export interface MessageRow {
  message_id: number;
  name: string;
  email: string;
  message: string;
  date_sent: string;
}

export async function listMessages(): Promise<MessageRow[]> {
  return query<MessageRow>(
    "SELECT * FROM tb_message ORDER BY date_sent DESC"
  );
}

export async function getMessage(id: number): Promise<MessageRow | null> {
  return queryOne<MessageRow>(
    "SELECT * FROM tb_message WHERE message_id=$1",
    [id]
  );
}

export async function deleteMessage(id: number): Promise<void> {
  await query("DELETE FROM tb_message WHERE message_id=$1", [id]);
}

export async function messageExists(id: number): Promise<boolean> {
  const count = await queryScalar<number>(
    "SELECT COUNT(*) FROM tb_message WHERE message_id=$1",
    [id]
  );
  return (count ?? 0) > 0;
}