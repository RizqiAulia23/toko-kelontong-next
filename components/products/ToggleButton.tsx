"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ToggleButton({
  productId,
  currentStatus,
}: {
  productId: number;
  currentStatus: 0 | 1;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(currentStatus);

  async function toggle() {
    setLoading(true);
    const res = await fetch("/api/products/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, currentStatus: status }),
    });
    if (res.ok) {
      setStatus(status === 1 ? 0 : 1);
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`badge ${status === 1 ? "badge-active" : "badge-inactive"}`}
      style={{ border: "none", cursor: "pointer" }}
      title="Click to toggle status"
    >
      <span className="dot"></span>
      {status === 1 ? "Active" : "Inactive"}
    </button>
  );
}
