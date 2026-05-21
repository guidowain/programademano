"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const navItems = [
  { href: "/admin", label: "Programas", icon: "▦" },
  { href: "/admin/metricas", label: "Métricas", icon: "◷" },
  { href: "/admin/programas/nuevo", label: "Nuevo", icon: "+" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-accent admin-gradient" />
      <div className="admin-sidebar-brand">
        <Link href="/" target="_blank">
          <strong>DRAMA</strong>
          <span>Programa de Mano</span>
        </Link>
      </div>

      <nav className="admin-nav" aria-label="Admin">
        {navItems.map((item) => {
          const isActive = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`admin-nav-link${isActive ? " is-active" : ""}`}
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="admin-sidebar-bottom">
        <Link href="/" target="_blank" className="admin-nav-link">
          <span aria-hidden="true">↗</span>
          Ver sitio
        </Link>
        <button type="button" onClick={handleLogout} className="admin-nav-link" style={{ width: "100%", border: 0, background: "transparent" }}>
          <span aria-hidden="true">↩</span>
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
