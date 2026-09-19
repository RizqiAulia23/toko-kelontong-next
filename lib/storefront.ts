// lib/storefront.ts — server-side only
import { query, queryOne } from "./db";

export interface ProductRow {
  product_id: number;
  category_id: number;
  product_name: string;
  product_price: string;
  product_description: string;
  product_image: string;
  product_status: number;
  date_created: string;
  category_name: string | null;
}

export interface CategoryRow {
  category_id: number;
  category_name: string;
}

export async function getActiveProducts(
  q?: string,
  categoryId?: number
): Promise<ProductRow[]> {
  const conditions: string[] = ["p.product_status = 1"];
  const params: unknown[] = [];
  let idx = 1;

  if (q && q.trim()) {
    conditions.push(`LOWER(p.product_name) ILIKE $${idx++}`);
    params.push(`%${q.trim().toLowerCase()}%`);
  }
  if (categoryId && categoryId > 0) {
    conditions.push(`p.category_id = $${idx++}`);
    params.push(categoryId);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  return query<ProductRow>(`
    SELECT p.*, c.category_name
    FROM tb_product p
    LEFT JOIN tb_category c ON c.category_id = p.category_id
    ${where}
    ORDER BY p.product_id DESC
  `, params);
}

export async function getFeaturedProducts(): Promise<ProductRow[]> {
  const all = await getActiveProducts();
  return all.slice(0, 3);
}

export async function getCategories(): Promise<CategoryRow[]> {
  return query<CategoryRow>(
    "SELECT category_id, category_name FROM tb_category ORDER BY category_name ASC"
  );
}

export async function getTotalActiveProducts(): Promise<number> {
  const row = await queryOne<{ count: string }>(
    "SELECT COUNT(*)::text AS count FROM tb_product WHERE product_status = 1"
  );
  return Number(row?.count ?? 0);
}
