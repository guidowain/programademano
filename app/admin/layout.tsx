import AdminSidebar from "@/components/admin/AdminSidebar";
import { headers } from "next/headers";

export const metadata = {
  title: "Admin - Programa de Mano",
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";

  if (pathname === "/admin/login") {
    return <div className="admin-shell">{children}</div>;
  }

  return (
    <div className="admin-shell admin-layout">
      <AdminSidebar />
      <main className="admin-content">{children}</main>
    </div>
  );
}
