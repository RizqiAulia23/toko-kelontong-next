import React from "react";
import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="app">
      <div className="overlay" id="overlay"></div>
      <Sidebar activeNav="dashboard" adminName="Admin" adminRole="admin" />
      <Navbar title="Dashboard" subtitle="VLONIX Retail Admin Cockpit" />
      {children}
      <Footer />
    </div>
  );
}
