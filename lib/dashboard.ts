// lib/dashboard.ts — server-side only
import { query, queryScalar } from "./db";

export interface DashboardStats {
  totalProducts: number;
  totalCategories: number;
  totalMessages: number;
  totalAdmins: number;
}

export interface RecentProduct {
  product_id: number;
  product_name: string;
  product_price: string;
  product_image: string;
  product_status: number;
  category_name: string | null;
  date_created: string;
}

export interface RecentMessage {
  message_id: number;
  name: string;
  email: string;
  message: string;
  date_sent: string;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [totalProducts, totalCategories, totalMessages, totalAdmins] = await Promise.all([
    queryScalar<number | string>("SELECT COUNT(*) FROM tb_product"),
    queryScalar<number | string>("SELECT COUNT(*) FROM tb_category"),
    queryScalar<number | string>("SELECT COUNT(*) FROM tb_message"),
    queryScalar<number | string>("SELECT COUNT(*) FROM tb_admin"),
  ]);

  return {
    totalProducts: Number(totalProducts ?? 0),
    totalCategories: Number(totalCategories ?? 0),
    totalMessages: Number(totalMessages ?? 0),
    totalAdmins: Number(totalAdmins ?? 0),
  };
}

export async function getRecentProducts(limit = 4): Promise<RecentProduct[]> {
  return query<RecentProduct>(
    `SELECT p.product_id, p.product_name, p.product_price, p.product_image, p.product_status, p.date_created, c.category_name
     FROM tb_product p
     LEFT JOIN tb_category c ON c.category_id = p.category_id
     ORDER BY p.date_created DESC
     LIMIT $1`,
    [limit]
  );
}

export async function getRecentMessages(limit = 5): Promise<RecentMessage[]> {
  return query<RecentMessage>(
    `SELECT message_id, name, email, message, date_sent
     FROM tb_message
     ORDER BY date_sent DESC
     LIMIT $1`,
    [limit]
  );
}
