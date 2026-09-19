// lib/categories.ts — server-side only
import { query, queryScalar } from "./db";

export interface CategoryRow {
  category_id: number;
  category_name: string;
}

export async function listCategories(): Promise<CategoryRow[]> {
  return query<CategoryRow>(
    "SELECT category_id, category_name FROM tb_category ORDER BY category_name ASC"
  );
}

export async function categoryExists(id: number): Promise<boolean> {
  const count = await queryScalar<number>(
    "SELECT COUNT(*) FROM tb_category WHERE category_id=$1",
    [id]
  );
  return (count ?? 0) > 0;
}

export async function createCategory(name: string): Promise<number> {
  const result = await queryScalar<number>(
    "INSERT INTO tb_category (category_name) VALUES ($1) RETURNING category_id",
    [name]
  );
  return result ?? 0;
}

export async function updateCategory(
  id: number,
  name: string
): Promise<void> {
  await query("UPDATE tb_category SET category_name=$1 WHERE category_id=$2", [
    name,
    id,
  ]);
}

export async function deleteCategory(id: number): Promise<void> {
  await query("DELETE FROM tb_category WHERE category_id=$1", [id]);
}

export async function getCategoryCountById(id: number): Promise<number> {
  const count = await queryScalar<number>(
    "SELECT COUNT(*) FROM tb_product WHERE category_id=$1",
    [id]
  );
  return count ?? 0;
}

