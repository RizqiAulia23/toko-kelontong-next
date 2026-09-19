// app/admin/categories/page.tsx
import { requireAdmin } from "@/lib/auth";
import { listCategories } from "@/lib/categories";
import { listProducts } from "@/lib/products";
import Link from "next/link";
import DeleteCategoryButton from "@/components/categories/DeleteCategoryButton";
import EditCategoryButton from "@/components/categories/EditCategoryButton";

export default async function CategoriesPage() {
  await requireAdmin();

  const [categories, products] = await Promise.all([
    listCategories(),
    listProducts(),
  ]);

  // Count products per category
  const productCountMap: Record<number, number> = {};
  products.forEach((p) => {
    const catId = p.category_id;
    productCountMap[catId] = (productCountMap[catId] ?? 0) + 1;
  });

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <h2>Categories</h2>
          <p>{categories.length} category/categories in catalog.</p>
        </div>
        <Link href="/admin/categories/new" className="btn btn-primary btn-sm">
          + Add Category
        </Link>
      </div>

      {categories.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">🏷️</div>
          <h3>No categories found.</h3>
          <p>Create your first category to classify inventory.</p>
          <Link href="/admin/categories/new" className="btn btn-primary btn-sm">
            + Add Category
          </Link>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th style={{ width: 80 }}>ID</th>
                <th>Category Name</th>
                <th style={{ width: 160 }}>Linked Products</th>
                <th style={{ width: 120, textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => {
                const count = productCountMap[c.category_id] ?? 0;
                return (
                  <tr key={c.category_id}>
                    <td><code>#{c.category_id}</code></td>
                    <td><strong>{c.category_name}</strong></td>
                    <td>
                      <span className="badge badge-count">
                        <i className="fa-solid fa-box-archive" style={{ fontSize: 11, marginRight: 4 }} />
                        {count} item(s)
                      </span>
                    </td>
                    <td>
                      <div className="row-actions" style={{ justifyContent: "flex-end" }}>
                        <EditCategoryButton categoryId={c.category_id} categoryName={c.category_name} />
                        <DeleteCategoryButton
                          categoryId={c.category_id}
                          categoryName={c.category_name}
                          productCount={count}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
