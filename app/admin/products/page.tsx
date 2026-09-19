// app/admin/products/page.tsx
import { requireAdmin } from "@/lib/auth";
import { listProducts } from "@/lib/products";
import { listCategories } from "@/lib/categories";
import Link from "next/link";
import DeleteButton from "@/components/products/DeleteButton";
import ToggleButton from "@/components/products/ToggleButton";

interface SearchParams {
  q?: string;
  category?: string;
  status?: string;
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireAdmin();
  const sp = await searchParams;

  const q = sp.q?.trim() ?? "";
  const categoryId = sp.category ? parseInt(sp.category, 10) : 0;
  const statusRaw = sp.status;
  const status =
    statusRaw === "1" ? 1 : statusRaw === "0" ? 0 : null;

  const [products, categories] = await Promise.all([
    listProducts({ q, categoryId, status: status as 0 | 1 | null }),
    listCategories(),
  ]);

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <h2>Catalog Inventory</h2>
          <p>{products.length} item(s) match current filters.</p>
        </div>
        <div className="toolbar">
          <form method="get" action="/admin/products" style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <div className="search-box">
              <input type="search" name="q" className="form-control" placeholder="Search product name..." defaultValue={q} />
            </div>
            <select name="category" className="form-control" style={{ width: "auto" }} defaultValue={categoryId || ""}>
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
              ))}
            </select>
            <select name="status" className="form-control" style={{ width: "auto" }} defaultValue={statusRaw ?? ""}>
              <option value="">All Statuses</option>
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>
            <button type="submit" className="btn btn-secondary btn-sm">Filter</button>
            {(q || categoryId > 0 || statusRaw !== undefined) && (
              <Link href="/admin/products" className="btn btn-ghost btn-sm">Reset</Link>
            )}
          </form>
          <Link href="/admin/products/new" className="btn btn-primary btn-sm">+ Add Product</Link>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">📦</div>
          <h3>No products found.</h3>
          <p>Try different filters or add a new product.</p>
          <Link href="/admin/products/new" className="btn btn-primary btn-sm">+ Add Product</Link>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th style={{ width: 70 }}>Image</th>
                <th>Product Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Status</th>
                <th style={{ textAlign: "right", width: 120 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.product_id}>
                  <td>
                    {p.product_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`/uploads/products/${p.product_image}`}
                        alt=""
                        style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 6, border: "1px solid var(--border)" }}
                      />
                    ) : (
                      <div style={{ width: 48, height: 48, borderRadius: 6, background: "var(--s2)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}>
                        🖼
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ maxWidth: 320 }}>
                      <strong>{p.product_name}</strong>
                      <small style={{ color: "var(--muted)", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.product_description}
                      </small>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-cyan">{p.category_name ?? "Uncategorized"}</span>
                  </td>
                  <td>
                    <span className="price">Rp {Number(p.product_price).toLocaleString("id-ID")}</span>
                  </td>
                  <td>
                    <ToggleButton
                      productId={p.product_id}
                      currentStatus={p.product_status as 0 | 1}
                    />
                  </td>
                  <td>
                    <div className="row-actions" style={{ justifyContent: "flex-end" }}>
                      <Link href={`/admin/products/${p.product_id}/edit`} className="icon-btn edit" title="Edit">✏️</Link>
                      <DeleteButton productId={p.product_id} productName={p.product_name} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
