"use client";

import { useState } from "react";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, message }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Failed to send message.");
    } else {
      setSuccess(true);
      setName("");
      setEmail("");
      setMessage("");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {error && (
        <div className="alert alert-error"><span>{error}</span></div>
      )}
      {success && (
        <div className="alert alert-success"><span>Message transmitted. Our retail desk will respond shortly.</span></div>
      )}

      <div className="form-group">
        <label htmlFor="name">Your Name <span>*</span></label>
        <input type="text" className="form-control" id="name" value={name} onChange={e => setName(e.target.value)} required maxLength={100} disabled={loading} placeholder="e.g. Budi Santoso" />
      </div>
      <div className="form-group">
        <label htmlFor="email">Email <span>*</span></label>
        <input type="email" className="form-control" id="email" value={email} onChange={e => setEmail(e.target.value)} required maxLength={100} disabled={loading} placeholder="you@example.com" />
      </div>
      <div className="form-group">
        <label htmlFor="message">Message <span>*</span></label>
        <textarea className="form-control" id="message" value={message} onChange={e => setMessage(e.target.value)} required disabled={loading} placeholder="How can VLONIX supply your store or household?" />
      </div>
      <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
        <i className="fa-solid fa-paper-plane"></i> Send Message
      </button>
    </form>
  );
}
