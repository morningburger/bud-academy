import type { Metadata } from "next";
import { requireViewer } from "@/lib/auth";
import { InstructorForm } from "@/components/instructor-form";
import { saveInstructorProfile } from "./actions";

export const metadata: Metadata = { title: "입점 신청" };

export default async function ApplyPage() {
  const viewer = await requireViewer("/partner/apply");
  const instructor = viewer.instructor;
  return (
    <div className="mx-auto max-w-[560px] px-4 pt-12">
      <h1 className="text-[26px] font-extrabold tracking-[-0.04em]">{instructor ? "강사 정보 수정" : "강사 입점 신청"}</h1>
      <p className="mt-2 mb-8 text-sub">
        {instructor?.status === "rejected"
          ? "보완해서 다시 보내주시면 재심사해요."
          : "심사에 필요한 정보예요. 승인되면 이 내용이 강사 프로필로 공개돼요."}
      </p>
      <InstructorForm
        action={saveInstructorProfile}
        instructor={instructor}
        defaultName={viewer.name ?? ""}
        submitLabel={instructor ? "저장하기" : "신청서 보내기"}
      />
    </div>
  );
}
