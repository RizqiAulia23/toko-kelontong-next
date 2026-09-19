// app/admin/profile/page.tsx
import { requireAdmin } from "@/lib/auth";
import ProfileForm from "@/components/admin/ProfileForm";
import ChangePasswordForm from "@/components/admin/ChangePasswordForm";

export default async function ProfilePage() {
  await requireAdmin();

  return (
    <div className="profile-grid">
      <div className="card profile-side">
        <div className="avatar">A</div>
        <h2 style={{ fontSize: 18, marginBottom: 4 }}>Admin</h2>
        <p style={{ color: "var(--secondary)", fontSize: 13, fontWeight: 600, marginBottom: 12 }}>@admin</p>
        <div className="badge badge-active" style={{ marginBottom: 20 }}>
          <span className="dot"></span> Role: Admin
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <h2><i className="fa-solid fa-user-pen" style={{ color: "var(--primary)" }}></i> Edit Profile</h2>
            <p>Update administrator details.</p>
          </div>
        </div>
        <div className="card-body">
          <ProfileForm />
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-head">
          <div>
            <h2><i className="fa-solid fa-key" style={{ color: "var(--secondary)" }}></i> Change Password</h2>
            <p>Update your account password.</p>
          </div>
        </div>
        <div className="card-body">
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  );
}
