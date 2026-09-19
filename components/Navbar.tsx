import React from "react";

export interface NavbarProps {
  title?: string;
  subtitle?: string;
  flash?: {
    type: "success" | "error" | "info" | "warning";
    message: string;
  } | null;
}

export function Navbar({
  title = "Dashboard",
  subtitle = "VLONIX Retail Admin Cockpit",
  flash = null,
}: NavbarProps) {
  return (
    <main className="main">
      <header className="topbar">
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <button
            className="menu-btn"
            id="menuBtn"
            type="button"
            aria-label="Toggle navigation"
          >
            ☰
          </button>
          <div>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
        </div>
        <div className="topbar-actions">
          <div className="badge badge-active" title="System Status Online">
            <span className="dot"></span>
            <span>Online</span>
          </div>
          <a
            className="btn btn-secondary btn-sm"
            href="/"
            target="_blank"
            rel="noopener"
          >
            Storefront
          </a>
        </div>
      </header>

      <div className="content">
        {flash && (
          <div
            className={`alert alert-${flash.type}`}
            role="alert"
            style={{ animation: "fadeInOut 4s ease" }}
          >
            <span>{flash.message}</span>
          </div>
        )}
      </div>
    </main>
  );
}
