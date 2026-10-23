"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/admin", label: "한눈에 보기" },
  { href: "/admin/enrollments", label: "수강 신청" },
  { href: "/admin/courses", label: "강좌·회차" },
  { href: "/admin/instructors", label: "강사" },
  { href: "/admin/members", label: "회원" },
  { href: "/admin/staff", label: "운영진" },
];

export function AdminNav({ badges }: { badges: Record<string, number> }) {
  const path = usePathname();
  const isActive = (href: string) => (href === "/admin" ? path === "/admin" : path.startsWith(href));
  return (
    <nav aria-label="관리자 메뉴" className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible -mx-4 px-4 lg:mx-0 lg:px-0 pb-1 lg:pb-0">
      {ITEMS.map((it) => {
        const active = isActive(it.href);
        const n = badges[it.href] ?? 0;
        return (
          <Link
            key={it.href}
            href={it.href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center justify-between gap-3 whitespace-nowrap rounded-xl px-3.5 h-10 text-[15px] font-semibold transition-colors ${
              active ? "bg-ink text-white" : "text-sub hover:bg-surface hover:text-ink"
            }`}
          >
            {it.label}
            {n > 0 && (
              <span className={`min-w-5 h-5 px-1.5 rounded-full text-[12px] font-bold grid place-items-center ${active ? "bg-white text-ink" : "bg-red text-white"}`}>
                {n}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
