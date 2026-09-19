// app/admin/dashboard/page.tsx
import React from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getDashboardStats, getRecentProducts, getRecentMessages } from "@/lib/dashboard";

export default async function DashboardPage() {
  const admin = await requireAdmin();
  const [stats, recentProducts, recentMessages] = await Promise.all([
    getDashboardStats(),
    getRecentProducts(4),
    getRecentMessages(5),
  ]);

  return (
    <div>
      <div className="card" style={{ marginBottom: "20px" }}>
        <div className="card-body">
          <h3>Welcome back, {admin.adminName}!</h3>
          <p style={{ color: "var(--muted)", marginTop: "4px" }}>
            Logged in as <strong>@{admin.username}</strong> ({admin.level}) · Mission Control
          </p>
        </div>
      </div>

      <div className="kpis">
        <div className="kpi green">
          <div className="kpi-label">Total Products</div>
          <div className="kpi-value">{stats.totalProducts}</div>
          <div className="kpi-sub">Total inventory SKUs</div>
          <div className="kpi-icon">📦</div>
        </div>
        <div className="kpi cyan">
          <div className="kpi-label">Total Categories</div>
          <div className="kpi-value">{stats.totalCategories}</div>
          <div className="kpi-sub">Organized catalogue tree</div>
          <div className="kpi-icon">🏷️</div>
        </div>
        <div className="kpi teal">
          <div className="kpi-label">Total Messages</div>
          <div className="kpi-value">{stats.totalMessages}</div>
          <div className="kpi-sub">Inbound customer signals</div>
          <div className="kpi-icon">📨</div>
        </div>
        <div className="kpi amber">
          <div className="kpi-label">Admins</div>
          <div className="kpi-value">{stats.totalAdmins}</div>
          <div className="kpi-sub">Registered operators</div>
          <div className="kpi-icon">👤</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-head">
            <div>
              <h2>Latest Products</h2>
              <p>Newest inventory mapped to categories.</p>
            </div>
            <Link className="btn btn-secondary btn-sm" href="/admin/products">
              View all
            </Link>
          </div>
          {recentProducts.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">📦</div>
              <h3>No products found.</h3>
              <p>Catalogue is empty. Seed your first item to activate telemetry.</p>
              <Link className="btn btn-primary btn-sm" href="/admin/products/new">
                + Add Product
              </Link>
            </div>
          ) : (
            <div>
              {recentProducts.map((p) => (
                <div className="list-item" key={p.product_id}>
                  {p.product_image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`/uploads/products/${p.product_image}`}
                      alt=""
                      style={{
                        width: "46px",
                        height: "46px",
                        objectFit: "cover",
                        borderRadius: "6px",
                        border: "1px solid var(--border)",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "46px",
                        height: "46px",
                        borderRadius: "6px",
                        background: "var(--s2)",
                        border: "1px solid var(--border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--muted)",
                      }}
                    >
                      🖼
                    </div>
                  )}
                  <div className="grow">
                    <strong>{p.product_name}</strong>
                    <br />
                    <small>
                      {p.category_name ?? "Uncategorized"} · Rp{" "}
                      {Number(p.product_price).toLocaleString("id-ID")}
                    </small>
                  </div>
                  <span
                    className={`badge ${
                      p.product_status === 1 ? "badge-active" : "badge-inactive"
                    }`}
                  >
                    <span className="dot"></span>
                    {p.product_status === 1 ? "Active" : "Inactive"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <h2>Recent Inbox</h2>
              <p>Latest customer transmissions.</p>
            </div>
            <Link className="btn btn-secondary btn-sm" href="/admin/messages">
              Open inbox
            </Link>
          </div>
          {recentMessages.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">✉️</div>
              <h3>No messages yet.</h3>
              <p>Customer enquiries will surface here instantly.</p>
            </div>
          ) : (
            <div>
              {recentMessages.map((m) => (
                <div className="list-item" key={m.message_id}>
                  <div className="avatar">
                    {(m.name ? m.name.charAt(0) : "?").toUpperCase()}
                  </div>
                  <div className="grow">
                    <strong>{m.name}</strong>
                    <br />
                    <small>
                      {m.email} ·{" "}
                      {new Date(m.date_sent).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </small>
                    <div className="msg-preview">{m.message}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: "16px" }}>
        <div className="card-head">
          <div>
            <h2>Quick Actions</h2>
            <p>Frequently executed cockpit operations.</p>
          </div>
        </div>
        <div className="card-body">
          <div className="toolbar">
            <Link className="btn btn-primary" href="/admin/products/new">
              + New Product
            </Link>
            <Link className="btn btn-secondary" href="/admin/categories/new">
              + New Category
            </Link>
            <Link className="btn btn-secondary" href="/admin/messages">
              Review Inbox
            </Link>
            <a
              className="btn btn-ghost"
              href="/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Inspect Storefront
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
