"use client";
import { useState } from "react";

interface Props {
  categoryId: number;
  categoryName: string;
}

export default function EditCategoryButton({ categoryId, categoryName }: Props) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(categoryName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed || trimmed === categoryName) {
      setEditing(false);
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/categories/${categoryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category_name: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Update failed.");
        setLoading(false);
        return;
      }
      setEditing(false);
      window.location.reload();
    } catch {
      setError("An error occurred.");
    }
    setLoading(false);
  }

  if (editing) {
    return (
      <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
        <input
          type="text"
          className="form-control"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          disabled={loading}
          style={{ width: "100%", padding: "4px 8px", fontSize: "13px" }}
          autoFocus
        />
        <button
          onClick={handleSave}
          className="btn btn-primary btn-sm"
          disabled={loading}
          style={{ padding: "4px 8px", fontSize: "11px" }}
        >
          Save
        </button>
        <button
          onClick={() => { setName(categoryName); setEditing(false); }}
          className="btn btn-ghost btn-sm"
          style={{ padding: "4px 8px", fontSize: "11px" }}
        >
          Cancel
        </button>
        {error && <span style={{ color: "var(--danger)", fontSize: "12px" }}>{error}</span>}
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="icon-btn edit"
      title="Edit category"
    >
      ✏️
    </button>
  );
}