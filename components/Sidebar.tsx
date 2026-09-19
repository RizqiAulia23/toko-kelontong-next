import React from "react";

export interface SidebarProps {
  activeNav?: string;
  adminName?: string;
  adminRole?: string;
}

export function Sidebar({
  activeNav = "dashboard",
  adminName = "Admin",
  adminRole = "admin",
}: SidebarProps) {
  return (
    <aside className="sidebar" id="sidebar">
      <div className="brand">
        <div className="brand-mark">V</div>
        <div>
          <div className="brand-name">VLONIX</div>
          <div className="brand-sub">Retail OS</div>
        </div>
      </div>

      <nav className="nav">
        <div className="nav-label">Management</div>
        <a
          className={`nav-link ${activeNav === "dashboard" ? "active" : ""}`}
          href="/admin/dashboard"
        >
          <span>Dashboard</span>
        </a>
        <a
          className={`nav-link ${activeNav === "products" ? "active" : ""}`}
          href="/admin/products"
        >
          <span>Products</span>
        </a>
        <a
          className={`nav-link ${activeNav === "categories" ? "active" : ""}`}
          href="/admin/categories"
        >
          <span>Categories</span>
        </a>
        <a
          className={`nav-link ${activeNav === "messages" ? "active" : ""}`}
          href="/admin/messages"
        >
          <span>Messages</span>
        </a>

        <div className="nav-label">Account</div>
        <a
          className={`nav-link ${activeNav === "profile" ? "active" : ""}`}
          href="/admin/profile"
        >
          <span>Profile</span>
        </a>
      </nav>

      <div className="nav-footer">
        <div className="admin-mini">
          <div className="avatar">{adminName.charAt(0).toUpperCase()}</div>
          <div style={{ minWidth: 0, overflow: "hidden" }}>
            <strong
              style={{
                textOverflow: "ellipsis",
                overflow: "hidden",
                whiteSpace: "nowrap",
              }}
            >
              {adminName}
            </strong>
            <small>{adminRole}</small>
          </div>
        </div>
        <a className="nav-link" href="/" target="_blank" rel="noopener">
          <span>View Website</span>
        </a>
        <a className="nav-link" href="/admin/logout">
          <span>Logout</span>
        </a>
      </div>
    </aside>
  );
}
