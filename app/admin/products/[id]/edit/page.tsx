// app/admin/products/[id]/edit/page.tsx
import { requireAdmin } from "@/lib/auth";
import { getProduct } from "@/lib/products";
import { listCategories } from "@/lib/categories";
import ProductForm from "@/components/products/ProductForm";
import { notFound } from "next/navigation";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const productId = parseInt(id, 10);

  if (isNaN(productId) || productId <= 0) notFound();

  const [product, categories] = await Promise.all([
    getProduct(productId),
    listCategories(),
  ]);

  if (!product) notFound();

  return (
    <div className="card" style={{ maxWidth: 760, margin: "0 auto" }}>
      <div className="card-head">
        <div>
          <h2>Edit Product #{product.product_id}</h2>
          <p>Modify details for {product.product_name}</p>
        </div>
      </div>
      <div className="card-body">
        <ProductForm categories={categories} product={product} />
      </div>
    </div>
  );
}
