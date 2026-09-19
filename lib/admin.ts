// lib/admin.ts — server-side only
import { queryOne, query } from "./db";
import bcrypt from "bcryptjs";

export interface AdminProfileRow {
  admin_id: number;
  admin_name: string;
  username: string;
  admin_telp: string;
  admin_email: string;
  admin_address: string;
  level: string;
  password: string;
}

export async function getAdminById(id: number): Promise<AdminProfileRow | null> {
  return queryOne<AdminProfileRow>("SELECT * FROM tb_admin WHERE admin_id=$1", [id]);
}

export async function updateAdminProfile(
  id: number,
  data: {
    admin_name: string;
    username: string;
    admin_telp: string;
    admin_email: string;
    admin_address: string;
    passwordHash?: string;
  }
): Promise<void> {
  if (data.passwordHash) {
    await query(
      "UPDATE tb_admin SET admin_name=$1, username=$2, admin_telp=$3, admin_email=$4, admin_address=$5, password=$6 WHERE admin_id=$7",
      [data.admin_name, data.username, data.admin_telp, data.admin_email, data.admin_address, data.passwordHash, id]
    );
  } else {
    await query(
      "UPDATE tb_admin SET admin_name=$1, username=$2, admin_telp=$3, admin_email=$4, admin_address=$5 WHERE admin_id=$6",
      [data.admin_name, data.username, data.admin_telp, data.admin_email, data.admin_address, id]
    );
  }
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  try { return await bcrypt.compare(plain, hash); } catch { return false; }
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function isUsernameTaken(username: string, excludeId: number): Promise<boolean> {
  const row = await queryOne<{ cnt: string }>(
    "SELECT COUNT(*)::text AS cnt FROM tb_admin WHERE LOWER(username)=LOWER($1) AND admin_id!=$2",
    [username, excludeId]
  );
  return Number(row?.cnt ?? 0) > 0;
}
