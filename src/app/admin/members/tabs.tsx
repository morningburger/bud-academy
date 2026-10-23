import Link from "next/link";

const TABS = [
  { href: "/admin/members", label: "가입 회원" },
  { href: "/admin/members/legacy", label: "기존 사이트 명단" },
  { href: "/admin/members/branches", label: "지점 목록" },
];

export function MemberTabs({ active }: { active: string }) {
  return (
    <nav className="mt-5 flex gap-1.5 overflow-x-auto pb-1">
      {TABS.map((t) => (
        <Link key={t.href} href={t.href} className={`${active === t.href ? "btn-primary" : "btn-gray"} btn-sm whitespace-nowrap`}>{t.label}</Link>
      ))}
    </nav>
  );
}
