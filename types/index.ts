// Type definitions for VLONIX application

export interface Admin {
  id: number;
  name: string;
  username: string;
  email: string;
  telp: string;
  address: string;
  level: "admin" | "pelanggan";
}

export interface Category {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  categoryId: number;
  name: string;
  price: number;
  description: string;
  image: string;
  status: 0 | 1;
  dateCreated: string;
  categoryName?: string;
}

export interface Message {
  id: number;
  name: string;
  email: string;
  message: string;
  dateSent: string;
}

export interface Session {
  adminId: number;
  adminName: string;
  adminUsername: string;
  adminEmail: string;
  adminTelp: string;
  adminAddress: string;
  adminLevel: "admin" | "pelanggan";
}

export interface FlashMessage {
  type: "success" | "error" | "info" | "warning";
  message: string;
}
