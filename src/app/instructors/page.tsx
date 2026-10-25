import Link from "next/link";
import type { Metadata } from "next";
import { listApprovedInstructors } from "@/lib/queries";
import { Portrait } from "@/components/avatar";
import type { Instructor } from "@/lib/types";

export const metadata: Metadata = { title: "강사진" };

function Card({ i }: { i: Instructor }) {
  return (
    <li>
      <Link href={`/instructors/${i.id}`} className="group block">
        <Portrait name={i.name} url={i.photo_url} className="rounded-2xl" />
        <p className="mt-3 text-[16px] font-bold tracking-[-0.02em]">{i.name}</p>
        {i.headline && <p className="mt-0.5 text-[13px] text-sub leading-snug">{i.headline}</p>}
        {i.branch_name && (
          <p className="mt-0.5 text-[12px] text-muted">{i.affiliation === "gohair" ? `고정현헤어 ${i.branch_name}` : i.branch_name}</p>
        )}
      </Link>
    </li>
  );
}

function Section({ eyebrow, title, desc, list }: { eyebrow: string; title: string; desc: string; list: Instructor[] }) {
  if (list.length === 0) return null;
  return (
    <section className="mt-16">
      <p className="text-[12px] font-bold tracking-[0.18em] text-muted">{eyebrow}</p>
      <h2 className="mt-1 text-[24px] font-extrabold tracking-[-0.03em]">{title}</h2>
      <p className="mt-1.5 mb-6 text-[15px] text-sub">{desc}</p>
      <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
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
      <p className="text-[12px] font-bold tracking-[0.18em] text-muted">BUD ACADEMY FACULTY</p>
      <h1 className="mt-1 text-[30px] font-extrabold tracking-[-0.04em]">강사진</h1>
      <p className="mt-2 text-sub">현장에서 직접 가르치는 고정현헤어 강사진과 초청 원장님들이에요.</p>

      <nav className="mt-6 flex gap-2" aria-label="강사 구분">
        <Link href="/instructors" aria-current={!external ? "page" : undefined} className={`${!external ? "bg-ink text-white" : "bg-surface text-sub hover:text-ink"} rounded-full px-4 h-10 inline-flex items-center text-[15px] font-semibold`}>
          내부 강사진 <span className="ml-1.5 opacity-60">{internal.length}</span>
        </Link>
        <Link href="/instructors?tab=external" aria-current={external ? "page" : undefined} className={`${external ? "bg-ink text-white" : "bg-surface text-sub hover:text-ink"} rounded-full px-4 h-10 inline-flex items-center text-[15px] font-semibold`}>
          외부 초청 강사 <span className="ml-1.5 opacity-60">{guests.length}</span>
        </Link>
      </nav>

      {!external ? (
        <>
          {directors.map((d) => (
            <Link key={d.id} href={`/instructors/${d.id}`} className="group mt-10 grid sm:grid-cols-[300px_1fr] overflow-hidden rounded-3xl bg-[#111214] text-white">
              <Portrait name={d.name} url={d.photo_url} className="w-full sm:aspect-auto sm:h-full" />
              <div className="p-6 sm:p-10 flex flex-col justify-center min-w-0">
                <p className="text-[12px] font-bold tracking-[0.18em] text-[#c9a25c]">CREATIVE DIRECTOR</p>
                <p className="mt-2 text-[32px] font-extrabold tracking-[-0.03em]">{d.name}</p>
                <p className="text-[15px] text-[#b0b8c1]">{d.headline ?? "총괄 디렉터"}</p>
                {d.bio && <p className="mt-4 text-[15px] leading-relaxed text-[#d1d6db]">{d.bio}</p>}
                {d.career && (
                  <ul className="mt-5 grid gap-1.5 text-[13px] text-[#8b95a1] border-t border-white/10 pt-5">
                    {d.career.split("\n").filter(Boolean).slice(0, 6).map((c) => <li key={c} className="truncate">{c}</li>)}
                  </ul>
                )}
              </div>
            </Link>
          ))}
          <Section eyebrow="TREND TEAM" title="트렌드팀" desc="마스터 콴과 함께 트렌드 과정을 이끄는 강사진이에요." list={trend} />
          <Section eyebrow="EDUCATION TEAM" title="교육팀" desc="인턴 단계별 과정(LV1~3)을 맡는 강사진이에요." list={education} />
        </>
      ) : guests.length === 0 ? (
        <div className="mt-8 rounded-2xl bg-surface py-16 text-center text-sub">
          아직 등록된 초청 강사가 없어요.{" "}
          <Link href="/partner" className="text-blue font-semibold">강사로 참여하기</Link>
        </div>
      ) : (
        <Section eyebrow="GUEST" title="외부 초청 강사" desc="버드아카데미가 모신 다른 살롱의 원장님들이에요." list={guests} />
      )}
    </div>
  );
}
