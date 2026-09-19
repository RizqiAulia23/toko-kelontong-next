"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteButton({
  productId,
  productName,
}: {
  productId: number;
  productName: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete product "${productName}"? This cannot be undone.`)) return;
    setLoading(true);
    const res = await fetch(`/api/products/${productId}`, { method: "DELETE" });
    if (res.ok) {
      router.refresh();
    } else {
      alert("Failed to delete product.");
    }
    setLoading(false);
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="icon-btn del"
      title="Delete"
    >
      🗑
    </button>
  );
}
