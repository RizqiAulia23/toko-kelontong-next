"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  categoryId: number;
  categoryName: string;
  productCount: number;
}

export default function DeleteCategoryButton({
  categoryId,
  categoryName,
  productCount,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (productCount > 0) {
      alert(
        `Cannot delete category "${categoryName}" because ${productCount} product(s) are still mapped to it. Reassign or delete those products first.`
      );
      return;
    }

    if (!confirm(`Delete category "${categoryName}"? This cannot be undone.`)) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/categories/${categoryId}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      } else {
        alert("Failed to delete category.");
      }
    } catch {
      alert("An error occurred.");
    }
    setLoading(false);
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading || productCount > 0}
      className="icon-btn del"
      title={productCount > 0 ? "Cannot delete — products linked" : "Delete category"}
    >
      🗑
    </button>
  );
}
