"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfileForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [telp, setTelp] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ admin_name: name, username, admin_telp: telp, admin_email: email, admin_address: address }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Profile update failed.");
    } else {
      setSuccess(true);
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="alert alert-error"><span>{error}</span></div>}
      {success && <div className="alert alert-success"><span>Profile updated successfully.</span></div>}

      <div className="form-group">
        <label htmlFor="admin_name">Full Name <span>*</span></label>
        <input type="text" className="form-control" id="admin_name" value={name} onChange={e => setName(e.target.value)} required maxLength={100} disabled={loading} />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="username">Username <span>*</span></label>
          <input type="text" className="form-control" id="username" value={username} onChange={e => setUsername(e.target.value)} required maxLength={50} disabled={loading} />
        </div>
        <div className="form-group">
          <label htmlFor="admin_telp">Telephone / WhatsApp</label>
          <input type="text" className="form-control" id="admin_telp" value={telp} onChange={e => setTelp(e.target.value)} maxLength={25} disabled={loading} />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="admin_email">Email Address</label>
          <input type="email" className="form-control" id="admin_email" value={email} onChange={e => setEmail(e.target.value)} maxLength={100} disabled={loading} />
        </div>
        <div className="form-group">
          <label htmlFor="admin_address">Office Address</label>
          <textarea className="form-control" id="admin_address" value={address} onChange={e => setAddress(e.target.value)} rows={3} disabled={loading} />
        </div>
      </div>
      <button type="submit" className="btn btn-primary" disabled={loading}>
        <i className="fa-solid fa-floppy-disk"></i> Save Profile Changes
      </button>
    </form>
  );
}
