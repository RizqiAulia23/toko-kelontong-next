// app/admin/products/new/page.tsx
import { requireAdmin } from "@/lib/auth";
import { listCategories } from "@/lib/categories";
import ProductForm from "@/components/products/ProductForm";

export default async function NewProductPage() {
  await requireAdmin();
  const categories = await listCategories();

  return (
    <div className="card" style={{ maxWidth: 760, margin: "0 auto" }}>
      <div className="card-head">
        <div>
          <h2>Add Product</h2>
          <p>Register an inventory item into the retail catalog.</p>
        </div>
      </div>
      <div className="card-body">
        <ProductForm categories={categories} />
      </div>
    </div>
  );
}
