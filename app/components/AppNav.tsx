"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useData } from "@/lib/context/DataContext";

const MENU_ITEMS = [
  { href: "/dashboard", label: "대시보드" },
  { href: "/report", label: "보고서" },
  { href: "/data", label: "원본데이터" },
];

export function AppNav() {
  const pathname = usePathname();
  const { ready } = useData();

  return (
    <nav className="app-nav">
      <Link href="/" className="app-nav-brand">
        ERP 분석
      </Link>
      <ul className="app-nav-menu">
        {MENU_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`app-nav-item${active ? " app-nav-item--active" : ""}${!ready ? " app-nav-item--muted" : ""}`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
      {ready && <span className="app-nav-status">데이터 로드됨</span>}
    </nav>
  );
}
