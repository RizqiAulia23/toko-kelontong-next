import React from "react";

export function Footer() {
  return (
    <footer className="store-footer">
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <a href="/admin" style={{ color: "var(--secondary)" }}>
          Admin Cockpit
        </a>
      </div>
    </footer>
  );
}
