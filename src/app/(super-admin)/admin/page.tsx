// Admin Dashboard - Redirect to Super Admin
import { redirect } from "next/navigation";

export default function AdminPage() {
  redirect("/super-admin");
}
