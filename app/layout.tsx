// app/layout.tsx
import "./globals.css";

export const metadata = {
  title: "VLONIX — Modern Retail OS",
  description: "Admin Cockpit & Storefront backed by PostgreSQL",
};

// Simple root layout for now - can be expanded with providers later
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}