"use client";
import { useState } from "react";

export default function ChangePasswordForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      setLoading(false);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/profile/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Password change failed.");
    } else {
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="alert alert-error"><span>{error}</span></div>}
      {success && <div className="alert alert-success"><span>Password changed successfully.</span></div>}

      <div className="form-group">
        <label htmlFor="current_password">Current Password <span>*</span></label>
        <input type="password" className="form-control" id="current_password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required autoComplete="current-password" disabled={loading} />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="new_password">New Password <span>*</span></label>
          <input type="password" className="form-control" id="new_password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={8} autoComplete="new-password" disabled={loading} />
        </div>
        <div className="form-group">
          <label htmlFor="confirm_password">Confirm New Password <span>*</span></label>
          <input type="password" className="form-control" id="confirm_password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required autoComplete="new-password" disabled={loading} />
        </div>
      </div>
      <button type="submit" className="btn btn-primary" disabled={loading}>
        <i className="fa-solid fa-key"></i> Change Password
      </button>
    </form>
  );
}
