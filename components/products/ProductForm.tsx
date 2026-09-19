"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CategoryRow } from "@/lib/categories";
import { ProductRow } from "@/lib/products";

interface Props {
  categories: CategoryRow[];
  product?: ProductRow;
}

export default function ProductForm({ categories, product }: Props) {
  const router = useRouter();
  const isEdit = !!product;

  const [name, setName] = useState(product?.product_name ?? "");
  const [categoryId, setCategoryId] = useState(String(product?.category_id ?? ""));
  const [price, setPrice] = useState(String(product?.product_price ?? ""));
  const [description, setDescription] = useState(product?.product_description ?? "");
  const [currentImage, setCurrentImage] = useState(product?.product_image ?? "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<"1" | "0">(
    product?.product_status === 0 ? "0" : "1"
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError("");
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must not exceed 5 MB.");
      e.target.value = "";
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["jpg", "jpeg", "png", "webp", "gif"].includes(ext || "")) {
      setError("Unsupported format. Allowed: JPG, PNG, WEBP, GIF.");
      e.target.value = "";
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function handleRemoveImage() {
    setSelectedFile(null);
    setCurrentImage("");
    setPreviewUrl(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let finalImage = currentImage;

      // 1. If user selected a new file, upload securely via server API
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          setError(uploadData.error ?? "Failed to upload image.");
          setLoading(false);
          return;
        }

        // Use safe server-generated random filename
        finalImage = uploadData.filename;
      }

      // 2. Submit product data with validated safe image reference
      const payload = {
        product_name: name.trim(),
        category_id: parseInt(categoryId, 10),
        product_price: parseFloat(price),
        product_description: description.trim(),
        product_image: finalImage,
        product_status: parseInt(status, 10) as 0 | 1,
      };

      const url = isEdit ? `/api/products/${product!.product_id}` : "/api/products";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "An error occurred.");
        setLoading(false);
        return;
      }

      router.push("/admin/products");
      router.refresh();
    } catch {
      setError("An unexpected error occurred.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      )}

      <div className="form-group">
        <label htmlFor="product_name">Product Name <span>*</span></label>
        <input
          type="text"
          id="product_name"
          className="form-control"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={150}
          required
          disabled={loading}
          placeholder="e.g. Beras Pandan Wangi 5kg"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="category_id">Category <span>*</span></label>
          <select
            id="category_id"
            className="form-control"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
            disabled={loading}
          >
            <option value="">-- Choose Category --</option>
            {categories.map((c) => (
              <option key={c.category_id} value={c.category_id}>
                {c.category_name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="product_price">Price (IDR) <span>*</span></label>
          <input
            type="number"
            id="product_price"
            className="form-control"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            step="100"
            min="0"
            required
            disabled={loading}
            placeholder="e.g. 75000"
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="product_description">Description</label>
        <textarea
          id="product_description"
          className="form-control"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={loading}
          placeholder="Product details..."
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="product_image">Product Image</label>
          <input
            type="file"
            id="product_image"
            className="form-control"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileChange}
            disabled={loading}
          />
          <div className="form-hint">
            JPG, PNG, WEBP, or GIF up to 5MB. Filename will be generated securely.
          </div>

          {(previewUrl || currentImage) && (
            <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 12 }}>
              <div className="img-preview" style={{ margin: 0 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl ?? `/uploads/products/${currentImage}`}
                  alt="Preview"
                  style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 6, border: "1px solid var(--border)" }}
                />
              </div>
              <div>
                <small style={{ color: "var(--muted)", display: "block" }}>
                  {previewUrl ? "New image selected" : `Current: ${currentImage}`}
                </small>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="btn btn-ghost btn-sm"
                  style={{ marginTop: 4, padding: "2px 8px", fontSize: 11, color: "var(--danger)" }}
                >
                  Remove Image
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="product_status">Status</label>
          <select
            id="product_status"
            className="form-control"
            value={status}
            onChange={(e) => setStatus(e.target.value as "1" | "0")}
            disabled={loading}
          >
            <option value="1">Active (Visible in Storefront)</option>
            <option value="0">Inactive (Hidden / Draft)</option>
          </select>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 }}>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => router.push("/admin/products")}
          disabled={loading}
        >
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Saving..." : isEdit ? "Save Changes" : "Save Product"}
        </button>
      </div>
    </form>
  );
}
