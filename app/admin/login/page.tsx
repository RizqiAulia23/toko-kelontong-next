// app/admin/login/page.tsx
// Admin login page

import { redirect } from "next/navigation";
import Link from "next/link";
import { isAdminLoggedIn } from "@/lib/auth";
import LoginForm from "@/components/LoginForm";

export const metadata = {
  title: "Admin Login — VLONIX",
  description: "Administrator login for VLONIX Retail OS",
};

export default async function LoginPage() {
  // Redirect already-logged-in admins to dashboard
  const loggedIn = await isAdminLoggedIn();
  if (loggedIn) {
    redirect("/admin/dashboard");
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="brand">
          <div className="brand-mark">V</div>
          <div>
            <div className="brand-name">VLONIX</div>
            <div className="brand-sub">Retail Admin Cockpit</div>
          </div>
        </div>

        <h1>Sign in</h1>
        <p>Enter your administrator credentials to access the cockpit.</p>

        <LoginForm />

        <div className="auth-foot">
          <p>
            <Link href="/">← Return to Storefront</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
