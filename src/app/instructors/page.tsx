import Link from "next/link";
import type { Metadata } from "next";
import { listApprovedInstructors } from "@/lib/queries";
import { Avatar } from "@/components/avatar";
import type { Instructor } from "@/lib/types";

export const metadata: Metadata = { title: "강사진" };

function Card({ i }: { i: Instructor }) {
  return (
    <li>
      <Link href={`/instructors/${i.id}`} className="flex items-center gap-4 rounded-2xl bg-surface p-4 sm:p-5 hover:bg-surface-strong">
        <Avatar name={i.name} url={i.photo_url} size={60} />
        <div className="min-w-0">
          <p className="font-bold">{i.name}</p>
          <p className="text-[14px] text-sub truncate">{i.headline ?? ""}</p>
          {i.branch_name && (
            <p className="text-[13px] text-muted truncate">{i.affiliation === "gohair" ? `고정현헤어 ${i.branch_name}` : i.branch_name}</p>
          )}
        </div>
      </Link>
    </li>
  );
}

function Section({ title, desc, list }: { title: string; desc: string; list: Instructor[] }) {
  if (list.length === 0) return null;
  return (
    <section className="mt-12">
      <h2 className="text-[20px] font-bold">{title} <span className="text-muted font-semibold">{list.length}</span></h2>
      <p className="mt-1 mb-4 text-[14px] text-sub">{desc}</p>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((i) => <Card key={i.id} i={i} />)}
      </ul>
    </section>
  );
}

export default async function InstructorsPage({ searchParams }: PageProps<"/instructors">) {
  const { tab } = await searchParams;
  const external = tab === "external";
  const all = await listApprovedInstructors();
  const internal = all.filter((i) => i.affiliation === "gohair");
  const guests = all.filter((i) => i.affiliation !== "gohair");
  const directors = internal.filter((i) => i.team === "director");
  const trend = internal.filter((i) => i.team === "trend");
  const education = internal.filter((i) => i.team !== "director" && i.team !== "trend");

  return (
    <div className="mx-auto max-w-[1040px] px-4 sm:px-6 pt-10">
      <h1 className="text-[28px] font-extrabold tracking-[-0.04em]">강사진</h1>
      <p className="mt-2 text-sub">현장에서 직접 가르치는 고정현헤어 강사진과 초청 원장님들이에요.</p>

      <nav className="mt-6 flex gap-2" aria-label="강사 구분">
        <Link href="/instructors" aria-current={!external ? "page" : undefined} className={`${!external ? "btn-primary" : "btn-gray"} btn-sm`}>
          내부 강사진 {internal.length}
        </Link>
        <Link href="/instructors?tab=external" aria-current={external ? "page" : undefined} className={`${external ? "btn-primary" : "btn-gray"} btn-sm`}>
          외부 초청 강사 {guests.length}
        </Link>
      </nav>

      {!external ? (
        <>
          {directors.map((d) => (
            <Link key={d.id} href={`/instructors/${d.id}`} className="mt-8 flex flex-col sm:flex-row gap-6 rounded-3xl bg-ink text-white p-6 sm:p-8 hover:brightness-110 transition">
              <Avatar name={d.name} url={d.photo_url} size={112} />
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-[#9fc5ff]">{d.headline ?? "총괄 디렉터"}</p>
                <p className="mt-1 text-[26px] font-extrabold tracking-[-0.03em]">{d.name}</p>
                {d.bio && <p className="mt-2 text-[15px] leading-relaxed text-[#d1d6db]">{d.bio}</p>}
                {d.career && (
                  <ul className="mt-4 grid gap-1 sm:grid-cols-2 text-[13px] text-[#b0b8c1]">
                    {d.career.split("\n").filter(Boolean).slice(0, 6).map((c) => <li key={c} className="truncate">· {c}</li>)}
                  </ul>
                )}
              </div>
            </Link>
          ))}
          <Section title="트렌드팀" desc="마스터 콴과 함께 트렌드 커트·열펌 과정을 이끄는 강사진이에요." list={trend} />
          <Section title="교육팀" desc="인턴 단계별 과정(LV1~3)을 맡는 강사진이에요." list={education} />
        </>
      ) : guests.length === 0 ? (
        <div className="mt-8 rounded-2xl bg-surface py-16 text-center text-sub">
          아직 등록된 초청 강사가 없어요.{" "}
          <Link href="/partner" className="text-blue font-semibold">강사로 참여하기</Link>
        </div>
      ) : (
        <Section title="외부 초청 강사" desc="버드아카데미가 모신 다른 살롱의 원장님들이에요." list={guests} />
      )}
    </div>
  );
}
