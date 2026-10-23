import Link from "next/link";
import type { Metadata } from "next";
import { listApprovedInstructors } from "@/lib/queries";
import { Avatar } from "@/components/avatar";
import { SellerBadge } from "@/components/badges";

export const metadata: Metadata = { title: "강사" };

export default async function InstructorsPage() {
  const instructors = await listApprovedInstructors();
  return (
    <div className="mx-auto max-w-[1040px] px-4 sm:px-6 pt-10">
      <h1 className="text-[28px] font-extrabold tracking-[-0.04em]">강사</h1>
      <p className="mt-2 text-sub">심사를 거쳐 버드아카데미에서 강좌를 여는 분들이에요.</p>
      {instructors.length === 0 ? (
        <div className="mt-8 rounded-2xl bg-surface py-16 text-center text-sub">
          아직 등록된 강사가 없어요.{" "}
          <Link href="/partner" className="text-blue font-semibold">첫 강사로 참여하기</Link>
        </div>
      ) : (
        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {instructors.map((i) => (
            <li key={i.id}>
              <Link href={`/instructors/${i.id}`} className="flex items-center gap-4 rounded-2xl bg-surface p-5 hover:bg-surface-strong">
                <Avatar name={i.name} url={i.photo_url} />
                <div className="min-w-0">
                  <p className="font-bold flex items-center gap-1.5">{i.name}<SellerBadge isOfficial={false} instructor={i} /></p>
                  <p className="text-[14px] text-sub truncate">{i.headline ?? i.branch_name ?? ""}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
