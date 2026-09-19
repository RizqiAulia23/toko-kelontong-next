// lib/products.ts — server-side only
import { query, queryOne, queryScalar } from "./db";

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

export interface ProductFilters {
  q?: string;
  categoryId?: number;
  status?: 0 | 1 | null;
}

export async function listProducts(filters: ProductFilters = {}): Promise<ProductRow[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (filters.q?.trim()) {
    conditions.push(`p.product_name ILIKE $${idx++}`);
    params.push(`%${filters.q.trim()}%`);
  }
  if (filters.categoryId && filters.categoryId > 0) {
    conditions.push(`p.category_id = $${idx++}`);
    params.push(filters.categoryId);
  }
  if (filters.status === 0 || filters.status === 1) {
    conditions.push(`p.product_status = $${idx++}`);
    params.push(filters.status);
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

export async function getProduct(id: number): Promise<ProductRow | null> {
  return queryOne<ProductRow>(
    `SELECT p.*, c.category_name FROM tb_product p
     LEFT JOIN tb_category c ON c.category_id = p.category_id
     WHERE p.product_id = $1`,
    [id]
  );
}

export async function createProduct(data: {
  category_id: number;
  product_name: string;
  product_price: number;
  product_description: string;
  product_image: string;
  product_status: 0 | 1;
}): Promise<number> {
  const id = await queryScalar<number>(`
    INSERT INTO tb_product (category_id, product_name, product_price, product_description, product_image, product_status, date_created)
    VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
    RETURNING product_id
  `, [data.category_id, data.product_name, data.product_price, data.product_description, data.product_image, data.product_status]);
  return id ?? 0;
}

export async function updateProduct(
  id: number,
  data: {
    category_id: number;
    product_name: string;
    product_price: number;
    product_description: string;
    product_image: string;
    product_status: 0 | 1;
  }
): Promise<void> {
  await query(
    `UPDATE tb_product SET category_id=$1, product_name=$2, product_price=$3, product_description=$4, product_image=$5, product_status=$6 WHERE product_id=$7`,
    [data.category_id, data.product_name, data.product_price, data.product_description, data.product_image, data.product_status, id]
  );
}

export async function deleteProduct(id: number): Promise<void> {
  await query("DELETE FROM tb_product WHERE product_id = $1", [id]);
}

export async function toggleProductStatus(id: number, currentStatus: 0 | 1): Promise<void> {
  const newStatus = currentStatus === 1 ? 0 : 1;
  await query("UPDATE tb_product SET product_status=$1 WHERE product_id=$2", [newStatus, id]);
}

export async function productExists(id: number): Promise<boolean> {
  const count = await queryScalar<number>("SELECT COUNT(*) FROM tb_product WHERE product_id=$1", [id]);
  return (count ?? 0) > 0;
}
